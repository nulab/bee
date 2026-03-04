import { addApiKeyAuth, addBearerAuth } from "@repo/backlog-utils";
import { createClient } from "@repo/openapi-client/client";
import { usersGetMyself } from "@repo/openapi-client";
import { loadConfig } from "@repo/config";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  addApiKeyAuth: vi.fn(),
  addBearerAuth: vi.fn(),
}));

vi.mock("@repo/openapi-client/client", () => ({
  createClient: vi.fn(() => ({
    interceptors: { request: { use: vi.fn() } },
  })),
}));

vi.mock("@repo/openapi-client", () => ({
  usersGetMyself: vi.fn(),
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

    vi.mocked(usersGetMyself).mockResolvedValue({
      data: { name: "Test User", userId: "testuser" },
    } as never);

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: "https://example.backlog.com/api/v2",
    });
    expect(addApiKeyAuth).toHaveBeenCalledWith(
      vi.mocked(createClient).mock.results[0].value,
      "key",
    );
    expect(usersGetMyself).toHaveBeenCalledWith(expect.objectContaining({ throwOnError: true }));
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
      "No spaces are authenticated. Run `bl auth login` to get started.",
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
    expect(usersGetMyself).not.toHaveBeenCalled();
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

    vi.mocked(usersGetMyself).mockResolvedValue({
      data: { name: "Test User", userId: "testuser" },
    } as never);

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

    vi.mocked(usersGetMyself).mockRejectedValue(new Error("Unauthorized"));

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

    vi.mocked(usersGetMyself).mockResolvedValue({
      data: { name: "OAuth User", userId: "oauthuser" },
    } as never);

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(createClient).toHaveBeenCalledWith({
      baseUrl: "https://example.backlog.com/api/v2",
    });
    expect(addBearerAuth).toHaveBeenCalledWith(
      vi.mocked(createClient).mock.results[0].value,
      "oauth-access-token",
    );
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

    vi.mocked(usersGetMyself).mockResolvedValue({
      data: { name: "OAuth User", userId: "oauthuser" },
    } as never);

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

    vi.mocked(usersGetMyself).mockResolvedValue({
      data: { name: "Test User", userId: "testuser" },
    } as never);

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(consola.log).toHaveBeenCalledWith("  example.backlog.com");
  });
});
