import { createClient } from "@repo/api";
import { exchangeAuthorizationCode, startCallbackServer } from "@repo/backlog-utils";
import { promptRequired } from "@repo/cli-utils";
import { addSpace, findSpace, loadConfig, updateSpaceAuth, writeConfig } from "@repo/config";
import { spyOnProcessExit } from "@repo/test-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/api", () => ({
  createClient: vi.fn(),
}));

vi.mock("@repo/backlog-utils", () => ({
  exchangeAuthorizationCode: vi.fn(),
  startCallbackServer: vi.fn(),
  openUrl: vi.fn(),
}));

vi.mock("@repo/cli-utils", () => ({
  promptRequired: vi.fn(),
  readStdin: vi.fn(),
}));

vi.mock("@repo/config", () => ({
  addSpace: vi.fn(),
  findSpace: vi.fn(),
  loadConfig: vi.fn(),
  updateSpaceAuth: vi.fn(),
  writeConfig: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth login", () => {
  describe("api-key", () => {
    it("authenticates new space with --space and API key", async () => {
      const mockClient = vi.fn().mockResolvedValue({
        name: "Test User",
        userId: "testuser",
      });
      vi.mocked(createClient).mockReturnValue(mockClient as never);
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("test-api-key");
      vi.mocked(findSpace).mockReturnValue(null);
      vi.mocked(loadConfig).mockReturnValue({
        spaces: [],
        defaultSpace: undefined,
        aliases: {},
      });

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: { space: "example.backlog.com", method: "api-key" },
      } as never);

      expect(createClient).toHaveBeenCalledWith({
        host: "example.backlog.com",
        apiKey: "test-api-key",
      });
      expect(mockClient).toHaveBeenCalledWith("/users/myself");
      expect(addSpace).toHaveBeenCalledWith({
        host: "example.backlog.com",
        auth: { method: "api-key", apiKey: "test-api-key" },
      });
      expect(updateSpaceAuth).not.toHaveBeenCalled();
      expect(writeConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultSpace: "example.backlog.com",
        }),
      );
      expect(consola.success).toHaveBeenCalledWith(
        "Logged in to example.backlog.com as Test User (testuser)",
      );
    });

    it("updates credentials for existing space", async () => {
      const mockClient = vi.fn().mockResolvedValue({
        name: "Test User",
        userId: "testuser",
      });
      vi.mocked(createClient).mockReturnValue(mockClient as never);
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("new-api-key");
      vi.mocked(findSpace).mockReturnValue({
        host: "example.backlog.com",
        auth: { method: "api-key" as const, apiKey: "old-api-key" },
      });
      vi.mocked(loadConfig).mockReturnValue({
        spaces: [
          {
            host: "example.backlog.com",
            auth: { method: "api-key" as const, apiKey: "old-api-key" },
          },
        ],
        defaultSpace: "example.backlog.com",
        aliases: {},
      });

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: { space: "example.backlog.com", method: "api-key" },
      } as never);

      expect(updateSpaceAuth).toHaveBeenCalledWith("example.backlog.com", {
        method: "api-key",
        apiKey: "new-api-key",
      });
      expect(addSpace).not.toHaveBeenCalled();
      expect(writeConfig).not.toHaveBeenCalled();
      expect(consola.success).toHaveBeenCalledWith(
        "Logged in to example.backlog.com as Test User (testuser)",
      );
    });

    it("returns error on authentication failure", async () => {
      const mockClient = vi.fn().mockRejectedValue(new Error("Unauthorized"));
      vi.mocked(createClient).mockReturnValue(mockClient as never);
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("bad-key");
      const exitSpy = spyOnProcessExit();

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: { space: "example.backlog.com", method: "api-key" },
      } as never);

      expect(consola.error).toHaveBeenCalledWith(
        "Authentication failed. Could not connect to example.backlog.com with the provided API key.",
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(addSpace).not.toHaveBeenCalled();
      expect(updateSpaceAuth).not.toHaveBeenCalled();
      exitSpy.mockRestore();
    });
  });

  describe("invalid method", () => {
    it("returns error for invalid method", async () => {
      const exitSpy = spyOnProcessExit();

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: { space: "example.backlog.com", method: "invalid" },
      } as never);

      expect(consola.error).toHaveBeenCalledWith('Invalid auth method. Use "api-key" or "oauth".');
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe("oauth", () => {
    const setupOAuthMocks = () => {
      const mockClient = vi.fn().mockResolvedValue({
        name: "OAuth User",
        userId: "oauthuser",
      });
      vi.mocked(createClient).mockReturnValue(mockClient as never);
      vi.mocked(findSpace).mockReturnValue(null);
      vi.mocked(loadConfig).mockReturnValue({
        spaces: [],
        defaultSpace: undefined,
        aliases: {},
      });
      vi.mocked(exchangeAuthorizationCode).mockResolvedValue({
        access_token: "new-access-token",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "new-refresh-token",
      });

      const mockStop = vi.fn();
      const mockWaitForCallback = vi.fn().mockResolvedValue("auth-code-123");
      vi.mocked(startCallbackServer).mockReturnValue({
        port: 5033,
        waitForCallback: mockWaitForCallback,
        stop: mockStop,
      });

      return { mockClient, mockStop, mockWaitForCallback };
    };

    it("authenticates new space via OAuth flow", async () => {
      const { mockClient } = setupOAuthMocks();
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("my-client-id")
        .mockResolvedValueOnce("my-client-secret");

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: {
          space: "example.backlog.com",
          method: "oauth",
          "client-id": "my-client-id",
          "client-secret": "my-client-secret",
        },
      } as never);

      expect(startCallbackServer).toHaveBeenCalled();
      expect(exchangeAuthorizationCode).toHaveBeenCalledWith("example.backlog.com", {
        code: "auth-code-123",
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
        redirectUri: "http://localhost:5033/callback",
      });
      expect(createClient).toHaveBeenCalledWith({
        host: "example.backlog.com",
        accessToken: "new-access-token",
      });
      expect(mockClient).toHaveBeenCalledWith("/users/myself");
      expect(addSpace).toHaveBeenCalledWith({
        host: "example.backlog.com",
        auth: {
          method: "oauth",
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          clientId: "my-client-id",
          clientSecret: "my-client-secret",
        },
      });
      expect(consola.success).toHaveBeenCalledWith(
        "Logged in to example.backlog.com as OAuth User (oauthuser)",
      );
    });

    it("calls process.exit(1) when error occurs during callback", async () => {
      const mockStop = vi.fn();
      vi.mocked(startCallbackServer).mockReturnValue({
        port: 5033,
        waitForCallback: vi
          .fn()
          .mockRejectedValue(new Error("OAuth callback timed out after 5 minutes")),
        stop: mockStop,
      });
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("my-client-id")
        .mockResolvedValueOnce("my-client-secret");
      const exitSpy = spyOnProcessExit();

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: {
          space: "example.backlog.com",
          method: "oauth",
          "client-id": "my-client-id",
          "client-secret": "my-client-secret",
        },
      } as never);

      expect(consola.error).toHaveBeenCalledWith(
        "OAuth authorization failed: OAuth callback timed out after 5 minutes",
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockStop).toHaveBeenCalled();
      exitSpy.mockRestore();
    });

    it("calls process.exit(1) when token exchange fails", async () => {
      setupOAuthMocks();
      vi.mocked(exchangeAuthorizationCode).mockRejectedValue(new Error("invalid_grant"));
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("my-client-id")
        .mockResolvedValueOnce("my-client-secret");
      const exitSpy = spyOnProcessExit();

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: {
          space: "example.backlog.com",
          method: "oauth",
          "client-id": "my-client-id",
          "client-secret": "my-client-secret",
        },
      } as never);

      expect(consola.error).toHaveBeenCalledWith(
        "Failed to exchange authorization code for tokens.",
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it("calls process.exit(1) when token verification fails", async () => {
      setupOAuthMocks();
      const mockClient = vi.fn().mockRejectedValue(new Error("Unauthorized"));
      vi.mocked(createClient).mockReturnValue(mockClient as never);
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("my-client-id")
        .mockResolvedValueOnce("my-client-secret");
      const exitSpy = spyOnProcessExit();

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: {
          space: "example.backlog.com",
          method: "oauth",
          "client-id": "my-client-id",
          "client-secret": "my-client-secret",
        },
      } as never);

      expect(consola.error).toHaveBeenCalledWith("Authentication verification failed.");
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it("updates OAuth credentials for existing space", async () => {
      setupOAuthMocks();
      vi.mocked(findSpace).mockReturnValue({
        host: "example.backlog.com",
        auth: {
          method: "oauth" as const,
          accessToken: "old-access",
          refreshToken: "old-refresh",
          clientId: "old-client-id",
          clientSecret: "old-client-secret",
        },
      });
      vi.mocked(loadConfig).mockReturnValue({
        spaces: [
          {
            host: "example.backlog.com",
            auth: {
              method: "oauth" as const,
              accessToken: "old-access",
              refreshToken: "old-refresh",
              clientId: "old-client-id",
              clientSecret: "old-client-secret",
            },
          },
        ],
        defaultSpace: "example.backlog.com",
        aliases: {},
      });
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("my-client-id")
        .mockResolvedValueOnce("my-client-secret");

      const { login } = await import("#/commands/auth/login.js");
      await login.run?.({
        args: {
          space: "example.backlog.com",
          method: "oauth",
          "client-id": "my-client-id",
          "client-secret": "my-client-secret",
        },
      } as never);

      expect(updateSpaceAuth).toHaveBeenCalledWith("example.backlog.com", {
        method: "oauth",
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
      });
      expect(addSpace).not.toHaveBeenCalled();
      expect(writeConfig).not.toHaveBeenCalled();
    });
  });
});
