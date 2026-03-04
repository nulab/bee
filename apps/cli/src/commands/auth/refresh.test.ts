import { createClient } from "@repo/api";
import { refreshAccessToken } from "@repo/backlog-utils";
import { resolveSpace, updateSpaceAuth } from "@repo/config";
import { spyOnProcessExit } from "@repo/test-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/api", () => ({
  createClient: vi.fn(),
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
  it("calls process.exit(1) when no space is configured", async () => {
    vi.mocked(resolveSpace).mockReturnValue(null);
    const exitSpy = spyOnProcessExit();

    const { refresh } = await import("#src/commands/auth/refresh.js");
    await refresh.run?.({ args: {} } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "No space configured. Run `bl auth login` to authenticate.",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("shows error for API key authentication", async () => {
    vi.mocked(resolveSpace).mockReturnValue({
      host: "example.backlog.com",
      auth: { method: "api-key" as const, apiKey: "key" },
    });
    const exitSpy = spyOnProcessExit();

    const { refresh } = await import("#src/commands/auth/refresh.js");
    await refresh.run?.({ args: {} } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "Token refresh is only available for OAuth authentication. Current space uses API key.",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
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
    const exitSpy = spyOnProcessExit();

    const { refresh } = await import("#src/commands/auth/refresh.js");
    await refresh.run?.({ args: {} } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "Client ID and Client Secret are missing from the stored OAuth configuration. Please re-authenticate with `bl auth login -m oauth`.",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
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
    const mockClient = vi.fn().mockResolvedValue({
      name: "Test User",
      userId: "testuser",
    });
    vi.mocked(createClient).mockReturnValue(mockClient as never);

    const { refresh } = await import("#src/commands/auth/refresh.js");
    await refresh.run?.({ args: {} } as never);

    expect(refreshAccessToken).toHaveBeenCalledWith("example.backlog.com", {
      refreshToken: "old-refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    expect(createClient).toHaveBeenCalledWith({
      host: "example.backlog.com",
      accessToken: "new-access",
    });
    expect(mockClient).toHaveBeenCalledWith("/users/myself");
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
    const exitSpy = spyOnProcessExit();

    const { refresh } = await import("#src/commands/auth/refresh.js");
    await refresh.run?.({ args: {} } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "Failed to refresh OAuth token. Please re-authenticate with `bl auth login -m oauth`.",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
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
    const mockClient = vi.fn().mockRejectedValue(new Error("Unauthorized"));
    vi.mocked(createClient).mockReturnValue(mockClient as never);
    const exitSpy = spyOnProcessExit();

    const { refresh } = await import("#src/commands/auth/refresh.js");
    await refresh.run?.({ args: {} } as never);

    expect(consola.error).toHaveBeenCalledWith("Token verification failed after refresh.");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
