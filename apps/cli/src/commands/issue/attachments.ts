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
  long: `List attachments of a Backlog issue.

Shows file name, size, creator, and creation date.`,

  examples: [
    { description: "List attachments", command: "bee issue attachments PROJECT-123" },
    { description: "Output as JSON", command: "bee issue attachments PROJECT-123 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const attachments = withUsage(
  defineCommand({
    meta: {
      name: "attachments",
      description: "List issue attachments",
    },
    args: {
      ...outputArgs,
      issue: {
        type: "positional",
        description: "Issue ID or issue key",
        valueHint: "<PROJECT-123>",
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const files = await client.getIssueAttachments(args.issue);

      outputResult(files, args, (data) => {
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
