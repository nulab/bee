import { refreshAccessToken } from "@repo/backlog-utils";
import { resolveSpace, updateSpaceAuth } from "@repo/config";
import { Backlog } from "backlog-js";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

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
  resolveSpace: vi.fn(),
  updateSpaceAuth: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth refresh", () => {
  it("throws error when no space is configured", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);

    const { default: refresh } = await import("./refresh");
    await expect(refresh.parseAsync([], { from: "user" })).rejects.toThrow(
      "No space configured. Run `bee auth login` to authenticate.",
    );
  });

  it("shows error for API key authentication", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key" as const, apiKey: "key" },
    });

    const { default: refresh } = await import("./refresh");
    await expect(refresh.parseAsync([], { from: "user" })).rejects.toThrow(
      "Token refresh is only available for OAuth authentication. Current space uses API key.",
    );
  });

  it("shows error when clientId/clientSecret are missing", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: {
        method: "oauth" as const,
        accessToken: "access",
        refreshToken: "refresh",
      },
    });

    const { default: refresh } = await import("./refresh");
    await expect(refresh.parseAsync([], { from: "user" })).rejects.toThrow(
      "Client ID and Client Secret are missing from the stored OAuth configuration. Please re-authenticate with `bee auth login -m oauth`.",
    );
  });

  it("successfully refreshes token", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
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

    const { default: refresh } = await import("./refresh");
    await refresh.parseAsync([], { from: "user" });

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
    vi.mocked(resolveSpace).mockReturnValue({
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

    const { default: refresh } = await import("./refresh");
    await expect(refresh.parseAsync([], { from: "user" })).rejects.toThrow(
      "Failed to refresh OAuth token. Please re-authenticate with `bee auth login -m oauth`.",
    );
  });

  it("shows error when token verification fails after refresh", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
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

    const { default: refresh } = await import("./refresh");
    await expect(refresh.parseAsync([], { from: "user" })).rejects.toThrow(
      "Token verification failed after refresh.",
    );
  });
});
