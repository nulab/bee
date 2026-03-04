import { addApiKeyAuth, addBearerAuth } from "@repo/backlog-utils";
import { createClient } from "@repo/openapi-client/client";
import { usersGetMyself } from "@repo/openapi-client";
import type { User } from "@repo/openapi-client";
import { loadConfig } from "@repo/config";
import { defineCommand } from "citty";
import consola from "consola";
import type { CommandUsage } from "../../lib/command-usage";
import { withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display authentication status for configured Backlog spaces.

For each space, the authentication method and credential validity are
verified by calling the Backlog API. Any issues are included in the output.

The active (default) space is indicated so you can see which space will be
used when no --space flag is provided to other commands.`,

  examples: [
    { description: "Display status for all spaces", command: "bl auth status" },
    {
      description: "Check a specific space",
      command: "bl auth status -s xxx.backlog.com",
    },
    { description: "Show auth tokens in the output", command: "bl auth status --show-token" },
  ],

  annotations: {
    environment: [["BACKLOG_SPACE", "Filter by space hostname"]],
  },
};

const status = withUsage(
  defineCommand({
    meta: {
      name: "status",
      description: "Show authentication status",
    },
    args: {
      space: {
        type: "string",
        alias: "s",
        description: "Filter by space hostname",
      },
      "show-token": {
        type: "boolean",
        description: "Display the auth token",
      },
    },
    async run({ args }) {
      const config = loadConfig();

      const filterSpace = args.space || process.env.BACKLOG_SPACE;
      const spaces = filterSpace
        ? config.spaces.filter((s) => s.host === filterSpace)
        : config.spaces;

      if (spaces.length === 0) {
        if (filterSpace) {
          consola.info(`No authentication configured for ${filterSpace}.`);
        } else {
          consola.info("No spaces are authenticated. Run `bl auth login` to get started.");
        }
        return;
      }

      for (const space of spaces) {
        const isDefault = config.defaultSpace === space.host;
        const label = isDefault ? `${space.host} (default)` : space.host;

        let user: User | null = null;
        try {
          const client = createClient({ baseUrl: `https://${space.host}/api/v2` });
          if (space.auth.method === "api-key") {
            addApiKeyAuth(client, space.auth.apiKey);
          } else {
            addBearerAuth(client, space.auth.accessToken);
          }
          ({ data: user } = await usersGetMyself({ client, throwOnError: true }));
        } catch (error) {
          consola.debug("Token verification failed:", error);
        }

        consola.log("");
        consola.log(`  ${label}`);
        consola.log(`    Method: ${space.auth.method}`);

        if (user) {
          consola.log(`    User:   ${user.name} (${user.userId})`);
          consola.log("    Status: Authenticated");
        } else {
          consola.log("    Status: Authentication failed");
        }

        if (args["show-token"]) {
          const token =
            space.auth.method === "api-key" ? space.auth.apiKey : space.auth.accessToken;
          consola.log(`    Token:  ${token}`);
        }
      }

      consola.log("");
    },
  }),
  commandUsage,
);

export { commandUsage, status };
