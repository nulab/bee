import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Delete a watching item.

This removes the issue from your watching list. You will no longer receive
notifications for updates to the issue. You will be prompted for confirmation
unless \`--yes\` is provided.`,

  examples: [
    {
      description: "Delete a watching item (with confirmation)",
      command: "bee watching delete 12345",
    },
    {
      description: "Delete without confirmation",
      command: "bee watching delete 12345 --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const deleteWatching = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete a watching item",
    },
    args: {
      ...outputArgs,
      watching: {
        type: "positional",
        description: "Watching ID",
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
        `Are you sure you want to delete watching ${args.watching}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const result = await client.deletehWatchingListItem(Number(args.watching));

      outputResult(result, args, (data) => {
        consola.success(`Deleted watching ${data.id}.`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteWatching };
