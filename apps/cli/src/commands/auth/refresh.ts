import { refreshAccessToken } from "@repo/backlog-utils";
import { UserError } from "@repo/cli-utils";
import { findSpace, loadConfig, updateSpaceAuth } from "@repo/config";
import { Backlog } from "backlog-js";
import consola from "consola";
import { BeeCommand } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const refresh = new BeeCommand("refresh")
  .summary("Refresh OAuth token")
  .description(
    `Only available for spaces authenticated with OAuth. If the refresh token is expired, re-authenticate with \`bee auth login -m oauth\`.`,
  )
  .addOption(opt.space())
  .examples([
    { description: "Refresh token for default space", command: "bee auth refresh" },
    {
      description: "Refresh token for specific space",
      command: "bee auth refresh -s xxx.backlog.com",
    },
  ])
  .action(async (opts) => {
    const config = loadConfig();
    const host = opts.space ?? config.defaultSpace;
    const space = host ? findSpace(config.spaces, host) : null;

    if (!space) {
      throw new UserError("No space configured. Run `bee auth login` to authenticate.");
    }

    if (space.auth.method !== "oauth") {
      throw new UserError(
        "Token refresh is only available for OAuth authentication. Current space uses API key.",
      );
    }

    const { clientId, clientSecret } = space.auth;
    if (!clientId || !clientSecret) {
      throw new UserError(
        "Client ID and Client Secret are missing from the stored OAuth configuration. Please re-authenticate with `bee auth login -m oauth`.",
      );
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
      throw new UserError(
        "Failed to refresh OAuth token. Please re-authenticate with `bee auth login -m oauth`.",
      );
    }

    let user;
    try {
      const client = new Backlog({ host: space.host, accessToken: tokenResponse.access_token });
      user = await client.getMyself();
    } catch {
      throw new UserError("Token verification failed after refresh.");
    }

    updateSpaceAuth(space.host, {
      method: "oauth",
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      clientId,
      clientSecret,
    });

    consola.success(`Token refreshed for ${space.host} (${user.name})`);
  });

export default refresh;
