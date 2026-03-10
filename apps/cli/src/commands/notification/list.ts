import { NOTIFICATION_REASON_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List notifications")
  .description(
    `Unread notifications are marked with \`*\`. Use \`--min-id\` / \`--max-id\` for cursor-based pagination.`,
  )
  .addOption(opt.count())
  .addOption(opt.minId())
  .addOption(opt.maxId())
  .addOption(opt.order())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List recent notifications", command: "bee notification list" },
    { description: "List the last 5 notifications", command: "bee notification list --count 5" },
    {
      description: "List notifications in ascending order",
      command: "bee notification list --order asc",
    },
    { description: "Output as JSON", command: "bee notification list --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient(opts.space);

    const notifications = await client.getNotifications({
      count: v.parse(v.optional(vInteger), opts.count),
      minId: v.parse(v.optional(vInteger), opts.minId),
      maxId: v.parse(v.optional(vInteger), opts.maxId),
      order: opts.order,
    });

    outputResult(notifications, opts, (data) => {
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
  });

export default list;
