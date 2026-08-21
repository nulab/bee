import { ACTIVITY_LABELS, getActivitySummary, getClient } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  outputResult,
  parseArg,
  printTable,
  vInteger,
} from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { collectNum } from "../../lib/common-options";

const activities = new BeeCommand("activities")
  .summary("List space activities")
  .description(
    `Results are ordered by most recent first. Use \`--activity-type\` to filter by type.

For activity type IDs, see:  
https://developer.nulab.com/docs/backlog/api/2/get-recent-updates/#response-description`,
  )
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
    { description: "List space activities", command: "bee space activities" },
    {
      description: "Show only issue-related activities",
      command: "bee space activities --activity-type 1 --activity-type 2 --activity-type 3",
    },
    {
      description: "Show last 50 activities",
      command: "bee space activities --count 50",
    },
    {
      description: "Output as JSON",
      command: "bee space activities --json",
    },
  ])
  .action(async (opts) => {
    const { client } = await getClient(opts.space);

    const activityTypeId: number[] = opts.activityType;

    const activityList = await client.getSpaceActivities({
      activityTypeId,
      count: parseArg(v.optional(vInteger), opts.count, "--count"),
      order: opts.order,
      minId: parseArg(v.optional(vInteger), opts.minId, "--min-id"),
      maxId: parseArg(v.optional(vInteger), opts.maxId, "--max-id"),
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
