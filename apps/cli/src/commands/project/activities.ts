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
import { type CommandUsage, withUsage } from "../../lib/command-usage";
import { ACTIVITY_LABELS } from "../../lib/activity-labels";

const commandUsage: CommandUsage = {
  long: `List recent activities of a Backlog project.

Shows the most recent updates including issue changes, wiki edits, git pushes,
and other project activities. Results are ordered by most recent first.

Use --activity-type to filter by specific activity types (comma-separated IDs).
Use --count to control how many activities are returned (default: 20, max: 100).`,

  examples: [
    { description: "List recent activities", command: "bee project activities PROJECT_KEY" },
    {
      description: "Show only issue-related activities",
      command: "bee project activities PROJECT_KEY --activity-type 1,2,3",
    },
    {
      description: "Show last 50 activities",
      command: "bee project activities PROJECT_KEY --count 50",
    },
    {
      description: "Output as JSON",
      command: "bee project activities PROJECT_KEY --json",
    },
  ],

  annotations: {
    environment: [["BACKLOG_PROJECT", "Default project ID or project key"]],
  },
};

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

const activities = withUsage(
  defineCommand({
    meta: {
      name: "activities",
      description: "List project activities",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
      "activity-type": {
        type: "string",
        description: "Filter by activity type IDs (comma-separated). e.g., 1,2,3",
      },
      count: {
        type: "string",
        description: "Number of activities to return (1-100, default: 20)",
      },
      order: {
        type: "string",
        description: "Sort order. {asc|desc}",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const activityTypeId = splitArg(args["activity-type"], v.number());

      const activityList = await client.getProjectActivities(args.project, {
        activityTypeId,
        count: args.count ? Number(args.count) : undefined,
        order: args.order as "asc" | "desc" | undefined,
      });

      outputResult(activityList, args, (data) => {
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
    },
  }),
  commandUsage,
);

export { commandUsage, activities };
