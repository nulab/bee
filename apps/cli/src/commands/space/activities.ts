import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  outputArgs,
  outputResult,
  printTable,
  splitArg,
} from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import { ACTIVITY_LABELS } from "../../lib/activity-labels";
import * as commonArgs from "../../lib/common-args";

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

const commandUsage: CommandUsage = {
  long: `List recent activities across the Backlog space.

Shows the most recent updates across the entire space, including
issue changes, wiki edits, git pushes, and other activities. Results are
ordered by most recent first.

Use \`--activity-type\` to filter by specific activity types (comma-separated IDs).
Use \`--count\` to control how many activities are returned (default: 20, max: 100).`,

  examples: [
    { description: "List space activities", command: "bee space activities" },
    {
      description: "Show only issue-related activities",
      command: "bee space activities --activity-type 1,2,3",
    },
    {
      description: "Show last 50 activities",
      command: "bee space activities --count 50",
    },
    {
      description: "Output as JSON",
      command: "bee space activities --json",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const activities = withUsage(
  defineCommand({
    meta: {
      name: "activities",
      description: "List space activities",
    },
    args: {
      ...outputArgs,
      "activity-type": {
        type: "string",
        description: "Filter by activity type IDs (comma-separated)",
        valueHint: "<1,2,3>",
      },
      count: commonArgs.count,
      order: commonArgs.order,
      "min-id": commonArgs.minId,
      "max-id": commonArgs.maxId,
    },
    async run({ args }) {
      const { client } = await getClient();

      const activityTypeId = splitArg(args["activity-type"], v.number());

      const activityList = await client.getSpaceActivities({
        activityTypeId,
        count: args.count ? Number(args.count) : undefined,
        order: args.order as "asc" | "desc" | undefined,
        minId: args["min-id"] ? Number(args["min-id"]) : undefined,
        maxId: args["max-id"] ? Number(args["max-id"]) : undefined,
      });

      outputResult(activityList, args, (data) => {
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
    },
  }),
  commandUsage,
);

export { commandUsage, activities };
