import { beforeEach, describe, expect, it, vi } from "vitest";
import consola from "consola";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("undici", () => {
  const MockAgent = vi.fn();
  MockAgent.prototype.compose = vi.fn(function (this: unknown) {
    return this;
  });
  return {
    Agent: MockAgent,
    setGlobalDispatcher: vi.fn(),
  };
});

describe("createLoggingInterceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("returns a function", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();
    expect(typeof interceptor).toBe("function");
  });

  it("calls consola.debug with request start log when dispatch is called", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockReturnValue(true);
    const wrappedDispatch = interceptor(mockDispatch);

    const opts = { method: "GET", origin: "https://example.backlog.com", path: "/api/v2/issues" };
    const handler = {
      onRequestStart: vi.fn(),
      onResponseStart: vi.fn(),
      onResponseData: vi.fn(),
      onResponseEnd: vi.fn(),
      onResponseError: vi.fn(),
    };

    wrappedDispatch(opts as never, handler as never);

    expect(consola.debug).toHaveBeenCalledWith(
      "[backlog] → GET https://example.backlog.com/api/v2/issues",
    );
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("calls consola.debug with response log when onResponseStart is called", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockImplementation((_opts, wrappedHandler) => {
      wrappedHandler.onResponseStart({}, 200, {}, "OK");
      return true;
    });

    const wrappedDispatch = interceptor(mockDispatch);
    const opts = { method: "POST", origin: "https://example.backlog.com", path: "/api/v2/issues" };
    const originalOnResponseStart = vi.fn();
    const handler = {
      onRequestStart: vi.fn(),
      onResponseStart: originalOnResponseStart,
      onResponseData: vi.fn(),
      onResponseEnd: vi.fn(),
      onResponseError: vi.fn(),
    };

    wrappedDispatch(opts as never, handler as never);

    expect(consola.debug).toHaveBeenCalledWith(
      "[backlog] → POST https://example.backlog.com/api/v2/issues",
    );
    expect(consola.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[backlog\] ← 200 POST https:\/\/example\.backlog\.com\/api\/v2\/issues \(\d+ms\)/,
      ),
    );
    expect(originalOnResponseStart).toHaveBeenCalledWith({}, 200, {}, "OK");
  });

  it("calls consola.debug with error log when onResponseError is called", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const testError = new Error("connection refused");
    const mockDispatch = vi.fn().mockImplementation((_opts, wrappedHandler) => {
      wrappedHandler.onResponseError({}, testError);
      return true;
    });

    const wrappedDispatch = interceptor(mockDispatch);
    const opts = {
      method: "DELETE",
      origin: "https://example.backlog.com",
      path: "/api/v2/issues/1",
    };
    const originalOnResponseError = vi.fn();
    const handler = {
      onRequestStart: vi.fn(),
      onResponseStart: vi.fn(),
      onResponseData: vi.fn(),
      onResponseEnd: vi.fn(),
      onResponseError: originalOnResponseError,
    };

    wrappedDispatch(opts as never, handler as never);

    expect(consola.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[backlog\] ✗ DELETE https:\/\/example\.backlog\.com\/api\/v2\/issues\/1 \(\d+ms\)/,
      ),
    );
    expect(originalOnResponseError).toHaveBeenCalledWith({}, testError);
  });
});

describe("installHttpLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls setGlobalDispatcher with a composed agent", async () => {
    const { Agent, setGlobalDispatcher } = await import("undici");
    const { installHttpLogger } = await import("./http-logger");

    installHttpLogger();

    expect(Agent).toHaveBeenCalled();
    expect(vi.mocked(Agent).prototype.compose).toHaveBeenCalled();
    expect(setGlobalDispatcher).toHaveBeenCalled();
  });
});
