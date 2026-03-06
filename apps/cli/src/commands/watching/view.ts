import { getClient } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display details of a watching item.

Shows the watching ID, associated issue, note, read status, and timestamps.`,

  examples: [
    { description: "View a watching item", command: "bee watching view 12345" },
    { description: "Output as JSON", command: "bee watching view 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a watching item",
    },
    args: {
      ...outputArgs,
      watching: {
        type: "positional",
        description: "Watching ID",
        required: true,
        valueHint: "<number>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const watching = await client.getWatchingListItem(Number(args.watching));

      outputResult(watching, args, (data) => {
        consola.log("");
        consola.log(`  ${data.issue.issueKey}: ${data.issue.summary}`);
        consola.log("");
        printDefinitionList([
          ["ID", String(data.id)],
          ["Issue Key", data.issue.issueKey],
          ["Title", data.issue.summary],
          ["Note", data.note || undefined],
          ["Read", data.resourceAlreadyRead ? "Read" : "Unread"],
          ["Created", formatDate(data.created)],
          ["Updated", formatDate(data.updated)],
        ]);
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
