import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List wiki pages in a Backlog project.

Use \`--keyword\` to filter pages by name or content.`,

  examples: [
    { description: "List all wiki pages in a project", command: "bee wiki list -p PROJECT" },
    {
      description: "Search wiki pages by keyword",
      command: 'bee wiki list -p PROJECT --keyword "setup"',
    },
    { description: "Output as JSON", command: "bee wiki list -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List wiki pages",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
      keyword: {
        type: "string",
        description: "Filter pages by keyword",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const wikis = await client.getWikis({
        projectIdOrKey: args.project,
        keyword: args.keyword,
      });

      outputResult(wikis, args, (data) => {
        if (data.length === 0) {
          consola.info("No wiki pages found.");
          return;
        }

        const rows: Row[] = data.map((wiki) => [
          { header: "ID", value: String(wiki.id) },
          { header: "NAME", value: wiki.name },
          { header: "UPDATED", value: wiki.updated.slice(0, 10) },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
