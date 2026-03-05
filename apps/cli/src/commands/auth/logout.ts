import { loadConfig, removeSpace } from "@repo/config";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const isNoInput = (): boolean => process.env.BACKLOG_NO_INPUT === "1";

const commandUsage: CommandUsage = {
  long: `Remove authentication for a Backlog space.

This command removes the stored authentication configuration for a space. The configuration is only removed locally.

This command does not revoke API keys or OAuth tokens on the Backlog server.

If only one space is configured, it will be selected automatically. If multiple spaces are configured, you will be prompted to select one.`,

  examples: [
    { description: "Select space via prompt", command: "bee auth logout" },
    {
      description: "Log out of a specific space",
      command: "bee auth logout -s xxx.backlog.com",
    },
  ],

  annotations: {
    environment: [
      ["BACKLOG_SPACE", "Space hostname to log out from"],
      ["BACKLOG_NO_INPUT", "Set to 1 to disable interactive prompts"],
    ],
  },
};

const logout = withUsage(
  defineCommand({
    meta: {
      name: "logout",
      description: "Remove authentication for a Backlog space",
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
      const config = loadConfig();

      let hostname = args.space || process.env.BACKLOG_SPACE;
      if (!hostname) {
        if (config.spaces.length === 0) {
          consola.info("No spaces are currently authenticated.");
          return;
        }

        const [firstSpace] = config.spaces;
        if (config.spaces.length === 1) {
          hostname = firstSpace.host;
        } else if (isNoInput()) {
          consola.error(
            "Hostname is required. Use --space to provide it in BACKLOG_NO_INPUT mode.",
          );
          return process.exit(1);
        } else {
          hostname = await consola.prompt("Select a space to log out from:", {
            type: "select",
            options: config.spaces.map((s) => s.host),
          });

          if (typeof hostname !== "string" || !hostname) {
            consola.error("No space selected.");
            return process.exit(1);
          }
        }
      }

      try {
        removeSpace(hostname);
      } catch {
        consola.error(`Space "${hostname}" is not configured.`);
        return process.exit(1);
      }

      consola.success(`Logged out of ${hostname}.`);
    },
  }),
  commandUsage,
);

export { commandUsage, logout };
