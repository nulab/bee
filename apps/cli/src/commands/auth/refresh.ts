import { createClient } from "@repo/api";
import { refreshAccessToken } from "@repo/backlog-utils";
import { findSpace, loadConfig, resolveSpace, updateSpaceAuth } from "@repo/config";
import { defineCommand } from "citty";
import consola from "consola";

type BacklogUser = {
  name: string;
  userId: string;
};

export const refresh = defineCommand({
  meta: {
    name: "refresh",
    description: "Refresh OAuth token",
  },
  args: {
    space: {
      type: "string",
      alias: "s",
      description: "Target space hostname",
    },
  },
  async run({ args }) {
    const space = args.space ? findSpace(loadConfig().spaces, args.space) : resolveSpace();

    if (!space) {
      consola.error("No space configured. Run `bl auth login` to authenticate.");
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
        "Client ID and Client Secret are missing from the stored OAuth configuration. Please re-authenticate with `bl auth login -m oauth`.",
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
        "Failed to refresh OAuth token. Please re-authenticate with `bl auth login -m oauth`.",
      );
      return process.exit(1);
    }

    const client = createClient({ host: space.host, accessToken: tokenResponse.access_token });
    let user: BacklogUser;
    try {
      user = await client<BacklogUser>("/users/myself");
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
});
