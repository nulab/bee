import { loadConfig } from "@repo/config";
import { Backlog } from "backlog-js";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockGetMyself = vi.fn();

vi.mock("backlog-js", () => ({
  Backlog: vi.fn(() => ({ getMyself: mockGetMyself })),
}));

vi.mock("@repo/config", () => ({ loadConfig: vi.fn() }));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth status", () => {
  it("displays status of authenticated spaces", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key" as const, apiKey: "key" },
        },
      ],
      defaultSpace: "example.backlog.com",
      aliases: {},
    });

    mockGetMyself.mockResolvedValue({ name: "Test User", userId: "testuser" });

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(Backlog).toHaveBeenCalledWith({ host: "example.backlog.com", apiKey: "key" });
    expect(mockGetMyself).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith("  example.backlog.com (default)");
    expect(consola.log).toHaveBeenCalledWith("    Method: api-key");
    expect(consola.log).toHaveBeenCalledWith("    User:   Test User (testuser)");
    expect(consola.log).toHaveBeenCalledWith("    Status: Authenticated");
  });

  it("shows message when no spaces are registered", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith(
      "No spaces are authenticated. Run `bee auth login` to get started.",
    );
  });

  it("shows message when --space filter has no match", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key" as const, apiKey: "key" },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });

    const { status } = await import("./status");
    await status.run?.({
      args: { space: "other.backlog.com" },
    } as never);

    expect(consola.info).toHaveBeenCalledWith(
      "No authentication configured for other.backlog.com.",
    );
    expect(mockGetMyself).not.toHaveBeenCalled();
  });

  it("displays token with --show-token", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key" as const, apiKey: "my-secret-key" },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });

    mockGetMyself.mockResolvedValue({ name: "Test User", userId: "testuser" });

    const { status } = await import("./status");
    await status.run?.({
      args: { "show-token": true },
    } as never);

    expect(consola.log).toHaveBeenCalledWith("    Token:  my-secret-key");
  });

  it("displays Authentication failed when token verification fails", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key" as const, apiKey: "invalid-key" },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });

    mockGetMyself.mockRejectedValue(new Error("Unauthorized"));

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(consola.log).toHaveBeenCalledWith("    Status: Authentication failed");
    expect(consola.debug).toHaveBeenCalledWith("Token verification failed:", expect.any(Error));
  });

  it("uses correct client options for OAuth-authenticated space", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: {
            method: "oauth" as const,
            accessToken: "oauth-access-token",
            refreshToken: "oauth-refresh-token",
          },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });

    mockGetMyself.mockResolvedValue({ name: "OAuth User", userId: "oauthuser" });

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(Backlog).toHaveBeenCalledWith({
      host: "example.backlog.com",
      accessToken: "oauth-access-token",
    });
    expect(mockGetMyself).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith("    Method: oauth");
    expect(consola.log).toHaveBeenCalledWith("    User:   OAuth User (oauthuser)");
  });

  it("displays OAuth token with --show-token", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: {
            method: "oauth" as const,
            accessToken: "oauth-access-token",
            refreshToken: "oauth-refresh-token",
          },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });

    mockGetMyself.mockResolvedValue({ name: "OAuth User", userId: "oauthuser" });

    const { status } = await import("./status");
    await status.run?.({
      args: { "show-token": true },
    } as never);

    expect(consola.log).toHaveBeenCalledWith("    Token:  oauth-access-token");
  });

  it("displays only hostname for non-default space", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key" as const, apiKey: "key" },
        },
      ],
      defaultSpace: "other.backlog.com",
      aliases: {},
    });

    mockGetMyself.mockResolvedValue({ name: "Test User", userId: "testuser" });

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(consola.log).toHaveBeenCalledWith("  example.backlog.com");
  });
});
