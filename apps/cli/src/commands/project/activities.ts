import { ACTIVITY_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
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
  .summary("List project activities")
  .description(
    `List recent activities of a Backlog project.

Shows the most recent updates including issue changes, wiki edits, git pushes,
and other project activities. Results are ordered by most recent first.

Use \`--activity-type\` to filter by specific activity types (repeatable).
Use \`--count\` to control how many activities are returned (default: 20, max: 100).

For a list of activity type IDs, see:
https://developer.nulab.com/docs/backlog/api/2/get-project-recent-updates/#activity-type`,
  )
  .argument("<project>", "Project ID or project key")
  .option(
    "--activity-type <id>",
    "Filter by activity type IDs (repeatable)",
    collectNum,
    [] satisfies number[],
  )
  .addOption(opt.count())
  .addOption(opt.order())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List recent activities", command: "bee project activities PROJECT_KEY" },
    {
      description: "Show only issue-related activities",
      command:
        "bee project activities PROJECT_KEY --activity-type 1 --activity-type 2 --activity-type 3",
    },
    {
      description: "Show last 50 activities",
      command: "bee project activities PROJECT_KEY --count 50",
    },
    {
      description: "Output as JSON",
      command: "bee project activities PROJECT_KEY --json",
    },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const activityTypeId: number[] = opts.activityType;

    const activityList = await client.getProjectActivities(project, {
      activityTypeId,
      count: opts.count ? Number(opts.count) : undefined,
      order: opts.order,
    });

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(activityList, { ...opts, json: jsonArg }, (data) => {
      if (data.length === 0) {
        consola.info("No activities found.");
        return;
      }

      const rows: Row[] = data.map((activity) => [
        { header: "DATE", value: formatDate(activity.created) },
        { header: "TYPE", value: ACTIVITY_LABELS[activity.type] ?? `Type ${activity.type}` },
        { header: "USER", value: activity.createdUser?.name ?? "Unknown" },
        { header: "SUMMARY", value: getActivitySummary(activity) },
      ]);

      printTable(rows);
    });
  });

export default activities;
