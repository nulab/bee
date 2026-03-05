import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const REASON_LABELS: Record<number, string> = {
  1: "Assigned",
  2: "Commented",
  3: "Issue created",
  4: "Issue updated",
  5: "File attached",
  6: "Project user added",
  9: "Other",
  10: "Pull request assigned",
  11: "Pull request commented",
  12: "Pull request added",
  13: "Pull request updated",
  14: "Comment mentioned",
  15: "Pull request comment mentioned",
  16: "Team mentioned",
  17: "Team mentioned in PR",
};

const commandUsage: CommandUsage = {
  long: `List notifications for the authenticated user.

Unread notifications are marked with an asterisk (\`*\`). Use \`--limit\` to
control the number of notifications returned, and \`--min-id\` / \`--max-id\`
for cursor-based pagination.`,

  examples: [
    { description: "List recent notifications", command: "bee notification list" },
    { description: "List the last 5 notifications", command: "bee notification list --limit 5" },
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
      limit: {
        type: "string",
        description: "Maximum number of notifications to return",
        valueHint: "<1-100>",
      },
      "min-id": {
        type: "string",
        description: "Minimum notification ID",
        valueHint: "<number>",
      },
      "max-id": {
        type: "string",
        description: "Maximum notification ID",
        valueHint: "<number>",
      },
      order: {
        type: "string",
        description: "Sort order",
        valueHint: "{asc|desc}",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const notifications = await client.getNotifications({
        count: args.limit ? Number(args.limit) : undefined,
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
          { header: "REASON", value: REASON_LABELS[n.reason] ?? String(n.reason) },
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
