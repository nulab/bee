import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List files attached to a Backlog wiki page.

Shows file name, size, creator, and creation date.`,

  examples: [
    { description: "List wiki attachments", command: "bee wiki attachments 12345" },
    { description: "Output as JSON", command: "bee wiki attachments 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const attachments = withUsage(
  defineCommand({
    meta: {
      name: "attachments",
      description: "List wiki page attachments",
    },
    args: {
      ...outputArgs,
      wiki: {
        type: "positional",
        description: "Wiki page ID",
        valueHint: "<number>",
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const files = await client.getWikisAttachments(Number(args.wiki));

      outputResult(files, args, (data) => {
        if (data.length === 0) {
          consola.info("No attachments found.");
          return;
        }

        const rows: Row[] = data.map(
          (f: { name: string; size: number; createdUser: { name: string }; created: string }) => [
            { header: "NAME", value: f.name },
            { header: "SIZE", value: String(f.size) },
            { header: "CREATED BY", value: f.createdUser.name },
            { header: "CREATED", value: formatDate(f.created) },
          ],
        );

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, attachments };
