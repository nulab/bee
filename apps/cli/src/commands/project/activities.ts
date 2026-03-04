import { type BacklogActivity } from "@repo/api";
import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "#/utils/client.js";
import { formatDate, getActivityLabel } from "#/utils/format.js";
import { outputArgs, outputResult } from "#/utils/output.js";

const activities = defineCommand({
  meta: {
    name: "activities",
    description: "Show recent project activities",
  },
  args: {
    ...outputArgs,
    projectKey: {
      type: "positional",
      description: "Project key",
      required: true,
    },
    limit: {
      type: "string",
      alias: "L",
      description: "Number of results",
      default: "20",
    },
    "activity-type": {
      type: "string",
      description: "Activity type IDs (comma-separated)",
    },
  },
  async run({ args }) {
    const { client } = await getClient();
    const limit = Number.parseInt(args.limit, 10);

    const query: Record<string, unknown> = {
      count: limit,
    };
    if (args["activity-type"]) {
      query["activityTypeId[]"] = args["activity-type"]
        .split(",")
        .map((id) => Number.parseInt(id.trim(), 10));
    }

    const activityList = await client<BacklogActivity[]>(
      `/projects/${args.projectKey}/activities`,
      { query },
    );

    outputResult(activityList, args, (data) => {
      if (data.length === 0) {
        consola.info("No activities found.");
        return;
      }

      for (const activity of data) {
        const date = formatDate(activity.created);
        const label = getActivityLabel(activity.type);
        const user = activity.createdUser.name;
        const summary =
          (activity.content["summary"] as string) ??
          (activity.content["key_id"]
            ? `${activity.project.projectKey}-${String(activity.content["key_id"])}`
            : "");

        consola.log(`${date}  ${label.padEnd(22)}  ${user.padEnd(14)}  ${summary}`);
      }
    });
  },
});

export { activities };
