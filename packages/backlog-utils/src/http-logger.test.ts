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

const newHandler = () => ({
  onRequestStart: vi.fn(),
  onResponseStart: vi.fn(),
  onResponseData: vi.fn(),
  onResponseEnd: vi.fn(),
  onResponseError: vi.fn(),
  onRequestUpgrade: vi.fn(),
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

  it("logs API host on the first request only", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockReturnValue(true);
    const wrappedDispatch = interceptor(mockDispatch);

    const opts1 = { method: "GET", origin: "https://example.backlog.com", path: "/api/v2/space" };
    const opts2 = { method: "GET", origin: "https://example.backlog.com", path: "/api/v2/users" };

    wrappedDispatch(opts1 as never, newHandler() as never);
    wrappedDispatch(opts2 as never, newHandler() as never);

    const hostCalls = vi
      .mocked(consola.debug)
      .mock.calls.filter((call) => typeof call[0] === "string" && call[0].startsWith("API host:"));
    expect(hostCalls).toHaveLength(1);
    expect(hostCalls[0]![0]).toBe("API host: https://example.backlog.com");
  });

  it("logs request start with method and path", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockReturnValue(true);
    const wrappedDispatch = interceptor(mockDispatch);

    const opts = { method: "GET", origin: "https://example.backlog.com", path: "/api/v2/issues" };
    wrappedDispatch(opts as never, newHandler() as never);

    expect(consola.debug).toHaveBeenCalledWith("→ GET /api/v2/issues");
  });

  it("logs response with status code and duration", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockImplementation((_opts, wrappedHandler) => {
      wrappedHandler.onResponseStart({}, 200, {}, "OK");
      return true;
    });

    const wrappedDispatch = interceptor(mockDispatch);
    const opts = { method: "POST", origin: "https://example.backlog.com", path: "/api/v2/issues" };
    const handler = newHandler();

    wrappedDispatch(opts as never, handler as never);

    expect(consola.debug).toHaveBeenCalledWith(
      expect.stringMatching(/← 200 POST \/api\/v2\/issues \(\d+ms\)/),
    );
    expect(handler.onResponseStart).toHaveBeenCalledWith({}, 200, {}, "OK");
  });

  it("logs error with duration", async () => {
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
    const handler = newHandler();

    wrappedDispatch(opts as never, handler as never);

    expect(consola.debug).toHaveBeenCalledWith(
      expect.stringMatching(/✗ DELETE \/api\/v2\/issues\/1 \(\d+ms\)/),
    );
    expect(handler.onResponseError).toHaveBeenCalledWith({}, testError);
  });

  it("masks apiKey and decodes percent-encoded query parameters", async () => {
    const { createLoggingInterceptor } = await import("./http-logger");
    const interceptor = createLoggingInterceptor();

    const mockDispatch = vi.fn().mockReturnValue(true);
    const wrappedDispatch = interceptor(mockDispatch);

    const opts = {
      method: "GET",
      origin: "https://example.backlog.com",
      path: "/api/v2/issues?apiKey=secret123&projectId%5B%5D=1",
    };
    wrappedDispatch(opts as never, newHandler() as never);

    expect(consola.debug).toHaveBeenCalledWith("→ GET /api/v2/issues?apiKey=***&projectId[]=1");
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
