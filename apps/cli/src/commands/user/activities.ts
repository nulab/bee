import { ACTIVITY_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { collectNum } from "../../lib/common-options";

const getActivitySummary = (activity: {
  type: number;
  content: {
    summary?: string | null;
    key_id?: number | null;
    deletedStatus?: { name?: string | null } | null;
    link?: { key_id?: number; title?: string }[] | null;
  };
}): string => {
  if (activity.type === 34 && activity.content.deletedStatus?.name) {
    return activity.content.deletedStatus.name;
  }
  if (activity.content.summary) {
    return activity.content.summary;
  }
  if (activity.content.link && activity.content.link.length > 0) {
    return activity.content.link
      .map((item) => (item.key_id ? `#${item.key_id}` : (item.title ?? "")))
      .filter(Boolean)
      .join(", ");
  }
  if (activity.content.key_id) {
    return `#${activity.content.key_id}`;
  }
  return "";
};

const activities = new BeeCommand("activities")
  .summary("List user activities")
  .description(
    `Results are ordered by most recent first. Use \`--activity-type\` to filter by type.

For activity type IDs, see:  
https://developer.nulab.com/docs/backlog/api/2/get-user-recent-updates/#response-description`,
  )
  .argument("<user>", "User ID")
  .option(
    "--activity-type <id>",
    "Filter by activity type IDs (repeatable)",
    collectNum,
    [] satisfies number[],
  )
  .addOption(opt.count())
  .addOption(opt.order())
  .addOption(opt.minId())
  .addOption(opt.maxId())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List user activities", command: "bee user activities 12345" },
    {
      description: "Show only issue-related activities",
      command: "bee user activities 12345 --activity-type 1 --activity-type 2 --activity-type 3",
    },
    {
      description: "Show last 50 activities",
      command: "bee user activities 12345 --count 50",
    },
    {
      description: "Output as JSON",
      command: "bee user activities 12345 --json",
    },
  ])
  .action(async (user, opts) => {
    const { client } = await getClient(opts.space);

    const activityTypeId: number[] = opts.activityType;

    const activityList = await client.getUserActivities(v.parse(vInteger, user), {
      activityTypeId,
      count: v.parse(v.optional(vInteger), opts.count),
      order: opts.order,
      minId: v.parse(v.optional(vInteger), opts.minId),
      maxId: v.parse(v.optional(vInteger), opts.maxId),
    });

    outputResult(activityList, opts, (data) => {
      if (data.length === 0) {
        consola.info("No activities found.");
        return;
      }

      const rows: Row[] = data.map((activity) => [
        { header: "DATE", value: formatDate(activity.created) },
        { header: "TYPE", value: ACTIVITY_LABELS[activity.type] ?? `Type ${activity.type}` },
        { header: "PROJECT", value: activity.project?.name ?? "" },
        { header: "SUMMARY", value: getActivitySummary(activity) },
      ]);

      printTable(rows);
    });
  });

export default activities;
