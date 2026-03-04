import { spyOnProcessExit } from "@repo/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClient } from "./client";
import { createClient } from "@repo/openapi-client/client";
import { resolveSpace } from "@repo/config";

vi.mock("@repo/config", () => ({
  resolveSpace: vi.fn(),
}));

vi.mock("@repo/openapi-client/client", () => ({
  createClient: vi.fn(() => ({ getConfig: () => ({}), setConfig: vi.fn() })),
  createConfig: vi.fn(() => ({})),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

type AuthCallback = (auth: { type: string; scheme?: string }) => string | undefined;

/** Extract the auth callback from the latest createClient mock call. */
const getAuthCallback = (): AuthCallback => {
  const config = vi.mocked(createClient).mock.calls.at(-1)?.at(0);
  expect(config?.auth).toBeTypeOf("function");
  return config!.auth as AuthCallback;
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

    const authFn = getAuthCallback();
    expect(authFn({ type: "apiKey" })).toBe("test-key");
    expect(authFn({ type: "http", scheme: "bearer" })).toBeUndefined();

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

    const authFn = getAuthCallback();
    expect(authFn({ type: "http", scheme: "bearer" })).toBe("access-token");
    expect(authFn({ type: "apiKey" })).toBeUndefined();

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

    const authFn = getAuthCallback();
    expect(authFn({ type: "apiKey" })).toBe("configured-key");

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

    const authFn = getAuthCallback();
    expect(authFn({ type: "apiKey" })).toBe("env-api-key");

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
