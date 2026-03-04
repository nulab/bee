import { spyOnProcessExit } from "@repo/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClient } from "#src/client.js";
import { createClient } from "@repo/api";
import { resolveSpace } from "@repo/config";

vi.mock("@repo/config", () => ({
  resolveSpace: vi.fn(),
}));

vi.mock("@repo/api", () => ({
  createClient: vi.fn(() => (() => {}) as unknown),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

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

    expect(createClient).toHaveBeenCalledWith({
      host: "example.backlog.com",
      apiKey: "test-key",
    });
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

    // OAuth uses ofetch.create directly, not createClient
    expect(createClient).not.toHaveBeenCalled();
    expect(result.host).toBe("example.backlog.com");
    expect(result.client).toBeTypeOf("function");
  });

  it("prioritizes configured space over BACKLOG_API_KEY", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "configured.backlog.com",
      auth: { method: "api-key" as const, apiKey: "configured-key" },
    });
    process.env.BACKLOG_API_KEY = "env-key";
    process.env.BACKLOG_SPACE = "configured.backlog.com";

    const result = await getClient();

    expect(createClient).toHaveBeenCalledWith({
      host: "configured.backlog.com",
      apiKey: "configured-key",
    });
    expect(result.host).toBe("configured.backlog.com");
  });

  it("falls back to BACKLOG_API_KEY and BACKLOG_SPACE env vars", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);
    process.env.BACKLOG_API_KEY = "env-api-key";
    process.env.BACKLOG_SPACE = "env.backlog.com";

    const result = await getClient();

    expect(createClient).toHaveBeenCalledWith({
      host: "env.backlog.com",
      apiKey: "env-api-key",
    });
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
