import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Delete a Backlog team.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,

  examples: [
    {
      description: "Delete a team (with confirmation)",
      command: "bee team delete 12345",
    },
    {
      description: "Delete a team without confirmation",
      command: "bee team delete 12345 --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const deleteTeam = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete a team",
    },
    args: {
      ...outputArgs,
      team: {
        type: "positional",
        description: "Team ID",
        required: true,
        valueHint: "<number>",
      },
      yes: {
        type: "boolean",
        alias: "y",
        description: "Skip confirmation prompt",
      },
    },
    async run({ args }) {
      const confirmed = await confirmOrExit(
        `Are you sure you want to delete team ${args.team}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const t = await client.deleteTeam(Number(args.team));

      outputResult(t, args, (data) => {
        consola.success(`Deleted team ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteTeam };
