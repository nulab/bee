import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  formatSize,
  outputArgs,
  outputResult,
  printTable,
} from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: "List attachments of a Backlog document.",

  examples: [
    { description: "List attachments", command: "bee document attachments 12345" },
    { description: "Output as JSON", command: "bee document attachments 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const attachments = withUsage(
  defineCommand({
    meta: {
      name: "attachments",
      description: "List document attachments",
    },
    args: {
      ...outputArgs,
      document: {
        type: "positional",
        description: "Document ID",
        valueHint: "<DOCUMENT-ID>",
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const doc = await client.getDocument(args.document);

      outputResult(doc.attachments, args, (data) => {
        if (data.length === 0) {
          consola.info("No attachments found.");
          return;
        }

        const rows: Row[] = data.map((file) => [
          { header: "ID", value: String(file.id) },
          { header: "NAME", value: file.name },
          { header: "SIZE", value: formatSize(file.size) },
          { header: "CREATED BY", value: file.createdUser?.name ?? "Unknown" },
          { header: "CREATED", value: formatDate(file.created) },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, attachments };
