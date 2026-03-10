import { exchangeAuthorizationCode, startCallbackServer } from "@repo/backlog-utils";
import { promptRequired } from "@repo/cli-utils";
import { updateConfig } from "@repo/config";
import { Backlog, OAuth2 } from "backlog-js";
import consola from "consola";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseCommand } from "@repo/test-utils";

const mockGetMyself = vi.fn();
const mockGetAuthorizationURL = vi.fn(
  () => "https://example.backlog.com/OAuth2AccessRequest.action?mocked=true",
);

vi.mock("backlog-js", () => ({
  Backlog: vi.fn(function () {
    return { getMyself: mockGetMyself };
  }),
  OAuth2: vi.fn(function () {
    return { getAuthorizationURL: mockGetAuthorizationURL };
  }),
}));

vi.mock("@repo/backlog-utils", () => ({
  exchangeAuthorizationCode: vi.fn(),
  startCallbackServer: vi.fn(),
  openUrl: vi.fn(),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
  readStdin: vi.fn(),
}));

vi.mock("@repo/config", () => ({
  updateConfig: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth login", () => {
  describe("api-key", () => {
    it("authenticates new space with API key", async () => {
      mockGetMyself.mockResolvedValue({ name: "Test User", userId: "testuser" });
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("test-api-key");
      vi.mocked(updateConfig).mockImplementation((updater) =>
        updater({ spaces: [], defaultSpace: undefined, aliases: {} }),
      );

      await parseCommand(() => import("./login"), ["--method", "api-key"]);

      expect(Backlog).toHaveBeenCalledWith({ host: "example.backlog.com", apiKey: "test-api-key" });
      expect(mockGetMyself).toHaveBeenCalled();
      const result = vi.mocked(updateConfig).mock.results[0]?.value;
      expect(result.spaces).toEqual([
        { host: "example.backlog.com", auth: { method: "api-key", apiKey: "test-api-key" } },
      ]);
      expect(result.defaultSpace).toBe("example.backlog.com");
      expect(consola.success).toHaveBeenCalledWith(
        "Logged in to example.backlog.com as Test User (testuser)",
      );
    });

    it("updates credentials for existing space", async () => {
      mockGetMyself.mockResolvedValue({ name: "Test User", userId: "testuser" });
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("new-api-key");
      vi.mocked(updateConfig).mockImplementation((updater) =>
        updater({
          spaces: [
            {
              host: "example.backlog.com",
              auth: { method: "api-key" as const, apiKey: "old-api-key" },
            },
          ],
          defaultSpace: "example.backlog.com",
          aliases: {},
        }),
      );

      await parseCommand(() => import("./login"), ["--method", "api-key"]);

      const result = vi.mocked(updateConfig).mock.results[0]?.value;
      expect(result.spaces).toEqual([
        { host: "example.backlog.com", auth: { method: "api-key", apiKey: "new-api-key" } },
      ]);
      expect(result.defaultSpace).toBe("example.backlog.com");
      expect(consola.success).toHaveBeenCalledWith(
        "Logged in to example.backlog.com as Test User (testuser)",
      );
    });

    it("returns error on authentication failure", async () => {
      mockGetMyself.mockRejectedValue(new Error("Unauthorized"));
      vi.mocked(promptRequired)
        .mockResolvedValueOnce("example.backlog.com")
        .mockResolvedValueOnce("bad-key");

      await expect(parseCommand(() => import("./login"), ["--method", "api-key"])).rejects.toThrow(
        "Authentication failed. Could not connect to example.backlog.com with the provided API key.",
      );
      expect(updateConfig).not.toHaveBeenCalled();
    });
  });

  describe("invalid method", () => {
    it("returns error for invalid method", async () => {
      await expect(parseCommand(() => import("./login"), ["--method", "invalid"])).rejects.toThrow(
        'Invalid auth method. Use "api-key" or "oauth".',
      );
    });
  });

  describe("oauth", () => {
    const setupOAuthMocks = () => {
      process.env.BACKLOG_OAUTH_CLIENT_ID = "my-client-id";
      process.env.BACKLOG_OAUTH_CLIENT_SECRET = "my-client-secret";

      mockGetMyself.mockResolvedValue({ name: "OAuth User", userId: "oauthuser" });
      vi.mocked(updateConfig).mockImplementation((updater) =>
        updater({ spaces: [], defaultSpace: undefined, aliases: {} }),
      );
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

      return { mockStop, mockWaitForCallback };
    };

    afterEach(() => {
      delete process.env.BACKLOG_OAUTH_CLIENT_ID;
      delete process.env.BACKLOG_OAUTH_CLIENT_SECRET;
    });

    it("throws error when OAuth env vars are missing", async () => {
      vi.mocked(promptRequired).mockResolvedValueOnce("example.backlog.com");

      await expect(parseCommand(() => import("./login"), ["--method", "oauth"])).rejects.toThrow(
        "BACKLOG_OAUTH_CLIENT_ID and BACKLOG_OAUTH_CLIENT_SECRET must be set as environment variables.",
      );
    });

    it("authenticates new space via OAuth flow", async () => {
      setupOAuthMocks();
      vi.mocked(promptRequired).mockResolvedValueOnce("example.backlog.com");

      await parseCommand(() => import("./login"), ["--method", "oauth"]);

      expect(startCallbackServer).toHaveBeenCalled();
      expect(OAuth2).toHaveBeenCalledWith({
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
      });
      expect(mockGetAuthorizationURL).toHaveBeenCalledWith({
        host: "example.backlog.com",
        redirectUri: "http://localhost:5033/callback",
        state: expect.any(String),
      });
      expect(exchangeAuthorizationCode).toHaveBeenCalledWith("example.backlog.com", {
        code: "auth-code-123",
        clientId: "my-client-id",
        clientSecret: "my-client-secret",
        redirectUri: "http://localhost:5033/callback",
      });
      expect(Backlog).toHaveBeenCalledWith({
        host: "example.backlog.com",
        accessToken: "new-access-token",
      });
      expect(mockGetMyself).toHaveBeenCalled();
      const result = vi.mocked(updateConfig).mock.results[0]?.value;
      expect(result.spaces).toEqual([
        {
          host: "example.backlog.com",
          auth: {
            method: "oauth",
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            clientId: "my-client-id",
            clientSecret: "my-client-secret",
          },
        },
      ]);
      expect(result.defaultSpace).toBe("example.backlog.com");
      expect(consola.success).toHaveBeenCalledWith(
        "Logged in to example.backlog.com as OAuth User (oauthuser)",
      );
    });

    it("throws error when error occurs during callback", async () => {
      process.env.BACKLOG_OAUTH_CLIENT_ID = "my-client-id";
      process.env.BACKLOG_OAUTH_CLIENT_SECRET = "my-client-secret";
      const mockStop = vi.fn();
      vi.mocked(startCallbackServer).mockReturnValue({
        port: 5033,
        waitForCallback: vi
          .fn()
          .mockRejectedValue(new Error("OAuth callback timed out after 5 minutes")),
        stop: mockStop,
      });
      vi.mocked(promptRequired).mockResolvedValueOnce("example.backlog.com");

      await expect(parseCommand(() => import("./login"), ["--method", "oauth"])).rejects.toThrow(
        "OAuth authorization failed: OAuth callback timed out after 5 minutes",
      );
      expect(mockStop).toHaveBeenCalled();
    });

    it("throws error when token exchange fails", async () => {
      setupOAuthMocks();
      vi.mocked(exchangeAuthorizationCode).mockRejectedValue(new Error("invalid_grant"));
      vi.mocked(promptRequired).mockResolvedValueOnce("example.backlog.com");

      await expect(parseCommand(() => import("./login"), ["--method", "oauth"])).rejects.toThrow(
        "Failed to exchange authorization code for tokens.",
      );
    });

    it("throws error when token verification fails", async () => {
      setupOAuthMocks();
      mockGetMyself.mockRejectedValue(new Error("Unauthorized"));
      vi.mocked(promptRequired).mockResolvedValueOnce("example.backlog.com");

      await expect(parseCommand(() => import("./login"), ["--method", "oauth"])).rejects.toThrow(
        "Authentication verification failed.",
      );
    });

    it("updates OAuth credentials for existing space", async () => {
      setupOAuthMocks();
      vi.mocked(updateConfig).mockImplementation((updater) =>
        updater({
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
        }),
      );
      vi.mocked(promptRequired).mockResolvedValueOnce("example.backlog.com");

      await parseCommand(() => import("./login"), ["--method", "oauth"]);

      const result = vi.mocked(updateConfig).mock.results[0]?.value;
      expect(result.spaces).toEqual([
        {
          host: "example.backlog.com",
          auth: {
            method: "oauth",
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            clientId: "my-client-id",
            clientSecret: "my-client-secret",
          },
        },
      ]);
      expect(result.defaultSpace).toBe("example.backlog.com");
    });
  });
});
