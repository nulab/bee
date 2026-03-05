import { loadConfig } from "@repo/config";
import { type Entity, Backlog } from "backlog-js";
import { defineCommand } from "citty";
import consola from "consola";
import { printDefinitionList } from "@repo/cli-utils";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display authentication status for configured Backlog spaces.

For each space, the authentication method and credential validity are
verified by calling the Backlog API. The active (default) space is indicated
so you can see which space is used when \`--space\` is not provided.`,

  examples: [
    { description: "Display status for all spaces", command: "bee auth status" },
    {
      description: "Check a specific space",
      command: "bee auth status -s xxx.backlog.com",
    },
    { description: "Show auth tokens in the output", command: "bee auth status --show-token" },
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
        description: "The hostname of the Backlog space",
        valueHint: "<xxx.backlog.com>",
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
          consola.info("No spaces are authenticated. Run `bee auth login` to get started.");
        }
        return;
      }

      for (const space of spaces) {
        const isDefault = config.defaultSpace === space.host;
        const label = isDefault ? `${space.host} (default)` : space.host;

        let user: Entity.User.User | null = null;
        try {
          const client =
            space.auth.method === "api-key"
              ? new Backlog({ host: space.host, apiKey: space.auth.apiKey })
              : new Backlog({ host: space.host, accessToken: space.auth.accessToken });
          user = await client.getMyself();
        } catch (error) {
          consola.debug("Token verification failed:", error);
        }

        consola.log("");
        consola.log(`  ${label}`);
        printDefinitionList([
          ["Method", space.auth.method],
          ["User", user ? `${user.name} (${user.userId})` : undefined],
          ["Status", user ? "Authenticated" : "Authentication failed"],
          [
            "Token",
            args["show-token"]
              ? (space.auth.method === "api-key"
                ? space.auth.apiKey
                : space.auth.accessToken)
              : undefined,
          ],
        ]);
      }

      consola.log("");
    },
  }),
  commandUsage,
);

export { commandUsage, status };
