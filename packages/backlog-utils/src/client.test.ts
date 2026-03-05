import { spyOnProcessExit } from "@repo/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClient } from "./client";
import { createClient } from "@repo/openapi-client/client";
import { resolveSpace } from "@repo/config";

vi.mock("@repo/config", () => ({
  resolveSpace: vi.fn(),
}));

vi.mock("@repo/openapi-client/client", () => ({
  createClient: vi.fn(() => ({
    interceptors: { request: { use: vi.fn() } },
  })),
  createConfig: vi.fn(() => ({})),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

/** Extract the last request interceptor function registered on the latest createClient result. */
const getLastRequestInterceptor = (): ((request: Request) => Request) => {
  const client = vi.mocked(createClient).mock.results.at(-1)?.value;
  const {calls} = client.interceptors.request.use.mock;
  expect(calls.length).toBeGreaterThan(0);
  return calls.at(-1)[0];
};

describe("getClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BACKLOG_API_KEY;
    delete process.env.BACKLOG_SPACE;
  });

  it("creates client with API Key authentication", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key" as const, apiKey: "test-key" },
    });

    const result = await getClient();

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://example.backlog.com/api/v2",
      }),
    );

    const interceptor = getLastRequestInterceptor();
    const req = new Request("https://example.com/test");
    const modified = interceptor(req);
    expect(new URL(modified.url).searchParams.get("apiKey")).toBe("test-key");

    expect(result.host).toBe("example.backlog.com");
  });

  it("creates client with OAuth authentication", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: {
        method: "oauth" as const,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });

    const result = await getClient();

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://example.backlog.com/api/v2",
      }),
    );

    const interceptor = getLastRequestInterceptor();
    const req = new Request("https://example.com/test");
    interceptor(req);
    expect(req.headers.get("Authorization")).toBe("Bearer access-token");

    expect(result.host).toBe("example.backlog.com");
  });

  it("prioritizes configured space over BACKLOG_API_KEY", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "configured.backlog.com",
      auth: { method: "api-key" as const, apiKey: "configured-key" },
    });
    process.env.BACKLOG_API_KEY = "env-key";
    process.env.BACKLOG_SPACE = "configured.backlog.com";

    const result = await getClient();

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://configured.backlog.com/api/v2",
      }),
    );

    const interceptor = getLastRequestInterceptor();
    const req = new Request("https://example.com/test");
    const modified = interceptor(req);
    expect(new URL(modified.url).searchParams.get("apiKey")).toBe("configured-key");

    expect(result.host).toBe("configured.backlog.com");
  });

  it("falls back to BACKLOG_API_KEY and BACKLOG_SPACE env vars", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);
    process.env.BACKLOG_API_KEY = "env-api-key";
    process.env.BACKLOG_SPACE = "env.backlog.com";

    const result = await getClient();

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://env.backlog.com/api/v2",
      }),
    );

    const interceptor = getLastRequestInterceptor();
    const req = new Request("https://example.com/test");
    const modified = interceptor(req);
    expect(new URL(modified.url).searchParams.get("apiKey")).toBe("env-api-key");

    expect(result.host).toBe("env.backlog.com");
  });

  it("calls process.exit(1) when BACKLOG_API_KEY set but no BACKLOG_SPACE", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);
    process.env.BACKLOG_API_KEY = "env-api-key";
    const mockExit = spyOnProcessExit();

    await getClient();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it("calls process.exit(1) when no space and no env vars configured", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);
    const mockExit = spyOnProcessExit();

    await getClient();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
