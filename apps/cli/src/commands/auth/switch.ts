import { loadConfig, writeConfig } from "@repo/config";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const isNoInput = (): boolean => process.env.BACKLOG_NO_INPUT === "1";

const commandUsage: CommandUsage = {
  long: `Switch the active (default) Backlog space.

Changes which space is used by default when running commands without
\`--space\`.

If multiple spaces are configured, you will be prompted to select one
interactively. Use \`--space\` to switch directly without a prompt.

For a list of configured spaces, see \`bee auth status\`.`,

  examples: [
    { description: "Select space via prompt", command: "bee auth switch" },
    {
      description: "Switch to a specific space",
      command: "bee auth switch -s xxx.backlog.com",
    },
  ],

  annotations: {
    environment: [
      ["BACKLOG_SPACE", "Space hostname to switch to"],
      ["BACKLOG_NO_INPUT", "Set to 1 to disable interactive prompts"],
    ],
  },
};

const switchSpace = withUsage(
  defineCommand({
    meta: {
      name: "switch",
      description: "Switch active space",
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
          consola.error("No spaces configured. Run `bee auth login` to add a space.");
          return process.exit(1);
        }

        if (isNoInput()) {
          consola.error(
            "Hostname is required. Use --space to provide it in BACKLOG_NO_INPUT mode.",
          );
          return process.exit(1);
        }

        const hosts = config.spaces.map((s) => s.host);
        hostname = await consola.prompt("Select space:", {
          type: "select",
          options: hosts,
        });

        if (typeof hostname !== "string" || !hostname) {
          consola.error("No space selected.");
          return process.exit(1);
        }
      }

      const space = config.spaces.find((s) => s.host === hostname);

      if (!space) {
        consola.error(
          `Space "${hostname}" not found. Available spaces: ${config.spaces.map((s) => s.host).join(", ")}`,
        );
        return process.exit(1);
      }

      writeConfig({ ...config, defaultSpace: hostname });

      consola.success(`Switched active space to ${hostname}.`);
    },
  }),
  commandUsage,
);

export { commandUsage, switchSpace };
