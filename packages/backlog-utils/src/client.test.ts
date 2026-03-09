import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClient } from "./client";
import { Backlog } from "backlog-js";
import { findSpace, loadConfig } from "@repo/config";

vi.mock("@repo/config", () => ({
  findSpace: vi.fn(),
  loadConfig: vi.fn(),
  updateSpaceAuth: vi.fn(),
}));

vi.mock("backlog-js", () => ({
  Backlog: vi.fn(function () {
    return { getMyself: vi.fn() };
  }),
  Error: {
    BacklogApiError: class extends globalThis.Error {
      status = 0;
    },
    BacklogAuthError: class extends globalThis.Error {
      status = 0;
    },
  },
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("getClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates client with API Key authentication when host is provided", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      aliases: {},
    });
    vi.mocked(findSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key" as const, apiKey: "test-key" },
    });

    const result = await getClient("example.backlog.com");

    expect(Backlog).toHaveBeenCalledWith({
      host: "example.backlog.com",
      apiKey: "test-key",
    });
    expect(result.host).toBe("example.backlog.com");
  });

  it("creates client with OAuth authentication when host is provided", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      aliases: {},
    });
    vi.mocked(findSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: {
        method: "oauth" as const,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });

    const result = await getClient("example.backlog.com");

    expect(Backlog).toHaveBeenCalledWith({
      host: "example.backlog.com",
      accessToken: "access-token",
    });
    expect(result.host).toBe("example.backlog.com");
  });

  it("uses config.defaultSpace when no host argument is provided", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      defaultSpace: "default.backlog.com",
      spaces: [],
      aliases: {},
    });
    vi.mocked(findSpace).mockReturnValue({
      host: "default.backlog.com",
      auth: { method: "api-key" as const, apiKey: "default-key" },
    });

    const result = await getClient();

    expect(findSpace).toHaveBeenCalledWith([], "default.backlog.com");
    expect(result.host).toBe("default.backlog.com");
  });

  it("throws error when no host argument and no defaultSpace configured", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      aliases: {},
    });

    await expect(async () => getClient()).rejects.toThrow("No space configured");
  });

  it("throws error when findSpace returns null for unknown host", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      aliases: {},
    });
    vi.mocked(findSpace).mockReturnValue(null);

    await expect(async () => getClient("unknown.backlog.com")).rejects.toThrow(
      'Space "unknown.backlog.com" not found',
    );
  });
});
