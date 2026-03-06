import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Delete a Backlog wiki page.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,

  examples: [
    {
      description: "Delete a wiki page (with confirmation)",
      command: "bee wiki delete 12345",
    },
    {
      description: "Delete a wiki page without confirmation",
      command: "bee wiki delete 12345 --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const deleteWiki = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete a wiki page",
    },
    args: {
      ...outputArgs,
      wiki: {
        type: "positional",
        description: "Wiki page ID",
        valueHint: "<number>",
        required: true,
      },
      yes: {
        type: "boolean",
        alias: "y",
        description: "Skip confirmation prompt",
      },
      notify: {
        type: "boolean",
        description: "Send notification email",
      },
    },
    async run({ args }) {
      const confirmed = await confirmOrExit(
        `Are you sure you want to delete wiki page ${args.wiki}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const wiki = await client.deleteWiki(Number(args.wiki), args.notify ?? false);

      outputResult(wiki, args, (data) => {
        consola.success(`Deleted wiki page ${data.id}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteWiki };
