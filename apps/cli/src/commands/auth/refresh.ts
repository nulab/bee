import { refreshAccessToken } from "@repo/backlog-utils";
import { findSpace, loadConfig, resolveSpace, updateSpaceAuth } from "@repo/config";
import { Backlog } from "backlog-js";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Refresh the OAuth access token for a Backlog space.

Uses the stored refresh token to obtain a new access token. Only available for spaces authenticated with OAuth.

If the refresh token is expired or invalid, re-authenticate with \`bee auth login -m oauth\`.`,

  examples: [
    { description: "Refresh token for default space", command: "bee auth refresh" },
    {
      description: "Refresh token for specific space",
      command: "bee auth refresh -s xxx.backlog.com",
    },
  ],

  annotations: {
    environment: [["BACKLOG_SPACE", "Default space hostname"]],
  },
};

const refresh = withUsage(
  defineCommand({
    meta: {
      name: "refresh",
      description: "Refresh OAuth token",
    },
    args: {
      space: {
        type: "string",
        alias: "s",
        description: "The hostname of the Backlog space",
        valueHint: "<xxx.backlog.com>",
      },
    },
    async run({ args }) {
      const space = args.space ? findSpace(loadConfig().spaces, args.space) : resolveSpace();

      if (!space) {
        consola.error("No space configured. Run `bee auth login` to authenticate.");
        return process.exit(1);
      }

      if (space.auth.method !== "oauth") {
        consola.error(
          "Token refresh is only available for OAuth authentication. Current space uses API key.",
        );
        return process.exit(1);
      }

      const { clientId, clientSecret } = space.auth;
      if (!clientId || !clientSecret) {
        consola.error(
          "Client ID and Client Secret are missing from the stored OAuth configuration. Please re-authenticate with `bee auth login -m oauth`.",
        );
        return process.exit(1);
      }

      consola.start(`Refreshing OAuth token for ${space.host}...`);

      let tokenResponse: Awaited<ReturnType<typeof refreshAccessToken>>;
      try {
        tokenResponse = await refreshAccessToken(space.host, {
          clientId,
          clientSecret,
          refreshToken: space.auth.refreshToken,
        });
      } catch {
        consola.error(
          "Failed to refresh OAuth token. Please re-authenticate with `bee auth login -m oauth`.",
        );
        return process.exit(1);
      }

      let user;
      try {
        const client = new Backlog({ host: space.host, accessToken: tokenResponse.access_token });
        user = await client.getMyself();
      } catch {
        consola.error("Token verification failed after refresh.");
        return process.exit(1);
      }

      updateSpaceAuth(space.host, {
        method: "oauth",
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        clientId,
        clientSecret,
      });

      consola.success(`Token refreshed for ${space.host} (${user.name})`);
    },
  }),
  commandUsage,
);

export { commandUsage, refresh };
