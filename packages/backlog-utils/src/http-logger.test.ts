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
    const handler = { onHeaders: vi.fn(), onError: vi.fn() };

    wrappedDispatch(opts as never, handler as never);

    expect(consola.debug).toHaveBeenCalledWith(
      "[backlog] → GET https://example.backlog.com/api/v2/issues",
    );
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("calls consola.debug with response log when onHeaders is called", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockImplementation((_opts, handler) => {
      // Simulate response by calling onHeaders on the wrapped handler
      handler.onHeaders(200, [], () => {}, "OK");
      return true;
    });

    const wrappedDispatch = interceptor(mockDispatch);
    const opts = { method: "POST", origin: "https://example.backlog.com", path: "/api/v2/issues" };
    const originalOnHeaders = vi.fn();
    const handler = { onHeaders: originalOnHeaders, onError: vi.fn() };

    wrappedDispatch(opts as never, handler as never);

    // Should have logged request start and response
    expect(consola.debug).toHaveBeenCalledWith(
      "[backlog] → POST https://example.backlog.com/api/v2/issues",
    );
    expect(consola.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[backlog\] ← 200 POST https:\/\/example\.backlog\.com\/api\/v2\/issues \(\d+ms\)/,
      ),
    );
    // Original handler's onHeaders should also be called
    expect(originalOnHeaders).toHaveBeenCalledWith(200, [], expect.any(Function), "OK");
  });

  it("calls consola.debug with error log when onError is called", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockImplementation((_opts, handler) => {
      handler.onError(new Error("connection refused"));
      return true;
    });

    const wrappedDispatch = interceptor(mockDispatch);
    const opts = {
      method: "DELETE",
      origin: "https://example.backlog.com",
      path: "/api/v2/issues/1",
    };
    const originalOnError = vi.fn();
    const handler = { onHeaders: vi.fn(), onError: originalOnError };

    wrappedDispatch(opts as never, handler as never);

    expect(consola.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[backlog\] ✗ DELETE https:\/\/example\.backlog\.com\/api\/v2\/issues\/1 \(\d+ms\)/,
      ),
    );
    // Original handler's onError should also be called
    expect(originalOnError).toHaveBeenCalledWith(expect.any(Error));
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
