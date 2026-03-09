import { refreshAccessToken } from "@repo/backlog-utils";
import { findSpace, loadConfig, updateSpaceAuth } from "@repo/config";
import { Backlog } from "backlog-js";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { parseCommand } from "@repo/test-utils";

const mockGetMyself = vi.fn();

vi.mock("backlog-js", () => ({
  Backlog: vi.fn(function () {
    return { getMyself: mockGetMyself };
  }),
}));

vi.mock("@repo/backlog-utils", () => ({
  refreshAccessToken: vi.fn(),
}));

vi.mock("@repo/config", () => ({
  findSpace: vi.fn(),
  loadConfig: vi.fn(),
  updateSpaceAuth: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockDefaultSpace = (space: ReturnType<typeof findSpace>) => {
  vi.mocked(loadConfig).mockReturnValue({
    spaces: space ? [space] : [],
    defaultSpace: space?.host,
    aliases: {},
  });
  vi.mocked(findSpace).mockReturnValue(space);
};

describe("auth refresh", () => {
  it("throws error when no space is configured", async () => {
    mockDefaultSpace(null);

    await expect(parseCommand(() => import("./refresh"))).rejects.toThrow(
      "No space configured. Run `bee auth login` to authenticate.",
    );
  });

  it("shows error for API key authentication", async () => {
    mockDefaultSpace({
      host: "example.backlog.com",
      auth: { method: "api-key" as const, apiKey: "key" },
    });

    await expect(parseCommand(() => import("./refresh"))).rejects.toThrow(
      "Token refresh is only available for OAuth authentication. Current space uses API key.",
    );
  });

  it("shows error when clientId/clientSecret are missing", async () => {
    mockDefaultSpace({
      host: "example.backlog.com",
      auth: {
        method: "oauth" as const,
        accessToken: "access",
        refreshToken: "refresh",
      },
    });

    await expect(parseCommand(() => import("./refresh"))).rejects.toThrow(
      "Client ID and Client Secret are missing from the stored OAuth configuration. Please re-authenticate with `bee auth login -m oauth`.",
    );
  });

  it("successfully refreshes token", async () => {
    mockDefaultSpace({
      host: "example.backlog.com",
      auth: {
        method: "oauth" as const,
        accessToken: "old-access",
        refreshToken: "old-refresh",
        clientId: "client-id",
        clientSecret: "client-secret",
      },
    });
    vi.mocked(refreshAccessToken).mockResolvedValue({
      access_token: "new-access",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "new-refresh",
    });
    mockGetMyself.mockResolvedValue({ name: "Test User", userId: "testuser" });

    await parseCommand(() => import("./refresh"));

    expect(refreshAccessToken).toHaveBeenCalledWith("example.backlog.com", {
      refreshToken: "old-refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    expect(Backlog).toHaveBeenCalledWith({
      host: "example.backlog.com",
      accessToken: "new-access",
    });
    expect(mockGetMyself).toHaveBeenCalled();
    expect(updateSpaceAuth).toHaveBeenCalledWith("example.backlog.com", {
      method: "oauth",
      accessToken: "new-access",
      refreshToken: "new-refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    expect(consola.success).toHaveBeenCalledWith(
      "Token refreshed for example.backlog.com (Test User)",
    );
  });

  it("shows error on refresh failure", async () => {
    mockDefaultSpace({
      host: "example.backlog.com",
      auth: {
        method: "oauth" as const,
        accessToken: "old-access",
        refreshToken: "expired-refresh",
        clientId: "client-id",
        clientSecret: "client-secret",
      },
    });
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error("invalid_grant"));

    await expect(parseCommand(() => import("./refresh"))).rejects.toThrow(
      "Failed to refresh OAuth token. Please re-authenticate with `bee auth login -m oauth`.",
    );
  });

  it("shows error when token verification fails after refresh", async () => {
    mockDefaultSpace({
      host: "example.backlog.com",
      auth: {
        method: "oauth" as const,
        accessToken: "old-access",
        refreshToken: "old-refresh",
        clientId: "client-id",
        clientSecret: "client-secret",
      },
    });
    vi.mocked(refreshAccessToken).mockResolvedValue({
      access_token: "bad-access",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "new-refresh",
    });
    mockGetMyself.mockRejectedValue(new Error("Unauthorized"));

    await expect(parseCommand(() => import("./refresh"))).rejects.toThrow(
      "Token verification failed after refresh.",
    );
  });
});
