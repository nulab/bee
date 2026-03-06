import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List watching items for the authenticated user.

Watching items are issue subscriptions. Unread items are marked with an
asterisk (\`*\`).`,

  examples: [
    { description: "List your watching items", command: "bee watching list" },
    { description: "Output as JSON", command: "bee watching list --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List watching items",
    },
    args: {
      ...outputArgs,
    },
    async run({ args }) {
      const { client } = await getClient();

      const myself = await client.getMyself();
      const watchings = await client.getWatchingListItems(myself.id);

      outputResult(watchings, args, (data) => {
        if (data.length === 0) {
          consola.info("No watching items found.");
          return;
        }

        const rows: Row[] = data.map((w) => [
          { header: "", value: w.resourceAlreadyRead ? " " : "*" },
          { header: "ID", value: String(w.id) },
          { header: "ISSUE KEY", value: w.issue.issueKey },
          { header: "TITLE", value: w.issue.summary },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
