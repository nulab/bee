import { NOTIFICATION_REASON_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List notifications for the authenticated user.

Unread notifications are marked with an asterisk (\`*\`). Use \`--count\` to
control the number of notifications returned, and \`--min-id\` / \`--max-id\`
for cursor-based pagination.`,

  examples: [
    { description: "List recent notifications", command: "bee notification list" },
    { description: "List the last 5 notifications", command: "bee notification list --count 5" },
    {
      description: "List notifications in ascending order",
      command: "bee notification list --order asc",
    },
    { description: "Output as JSON", command: "bee notification list --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List notifications",
    },
    args: {
      ...outputArgs,
      count: commonArgs.count,
      "min-id": commonArgs.minId,
      "max-id": commonArgs.maxId,
      order: commonArgs.order,
    },
    async run({ args }) {
      const { client } = await getClient();

      const notifications = await client.getNotifications({
        count: args.count ? Number(args.count) : undefined,
        minId: args["min-id"] ? Number(args["min-id"]) : undefined,
        maxId: args["max-id"] ? Number(args["max-id"]) : undefined,
        order: args.order as "asc" | "desc" | undefined,
      });

      outputResult(notifications, args, (data) => {
        if (data.length === 0) {
          consola.info("No notifications found.");
          return;
        }

        const rows: Row[] = data.map((n) => [
          { header: "", value: n.alreadyRead ? " " : "*" },
          { header: "ID", value: String(n.id) },
          { header: "REASON", value: NOTIFICATION_REASON_LABELS[n.reason] ?? String(n.reason) },
          { header: "ISSUE", value: n.issue?.issueKey ?? "-" },
          { header: "SUMMARY", value: n.issue?.summary ?? "-" },
          { header: "SENDER", value: n.sender.name },
          { header: "DATE", value: formatDate(n.created) },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
