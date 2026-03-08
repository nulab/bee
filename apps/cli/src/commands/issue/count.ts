import { PRIORITY_NAMES, PriorityId, getClient, resolveProjectIds } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Count issues matching the given filter criteria.

Accepts the same filter flags as \`bee issue list\`. Outputs a plain number
by default, or a JSON object with \`--json\`.`,

  examples: [
    { description: "Count all issues in a project", command: "bee issue count -p PROJECT" },
    {
      description: "Count open bugs assigned to you",
      command: 'bee issue count -p PROJECT -a @me -k "bug"',
    },
    { description: "Output as JSON", command: "bee issue count -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const count = withUsage(
  defineCommand({
    meta: {
      name: "count",
      description: "Count issues",
    },
    args: {
      ...outputArgs,
      project: {
        ...commonArgs.project,
        description: "Project ID or project key (comma-separated for multiple)",
      },
      assignee: commonArgs.assigneeList,
      status: {
        type: "string",
        alias: "S",
        description: "Status ID (comma-separated for multiple)",
      },
      priority: {
        type: "string",
        alias: "P",
        description: "Priority name (comma-separated for multiple)",
        valueHint: `{${PRIORITY_NAMES.join("|")}}`,
      },
      keyword: commonArgs.keyword,
      "created-since": {
        type: "string",
        description: "Show issues created on or after this date",
        valueHint: "<yyyy-MM-dd>",
      },
      "created-until": {
        type: "string",
        description: "Show issues created on or before this date",
        valueHint: "<yyyy-MM-dd>",
      },
      "updated-since": {
        type: "string",
        description: "Show issues updated on or after this date",
        valueHint: "<yyyy-MM-dd>",
      },
      "updated-until": {
        type: "string",
        description: "Show issues updated on or before this date",
        valueHint: "<yyyy-MM-dd>",
      },
      "due-since": {
        type: "string",
        description: "Show issues due on or after this date",
        valueHint: "<yyyy-MM-dd>",
      },
      "due-until": {
        type: "string",
        description: "Show issues due on or before this date",
        valueHint: "<yyyy-MM-dd>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const projectId = await resolveProjectIds(client, splitArg(args.project, v.string()));
      const assigneeId = splitArg(args.assignee, v.number());
      const statusId = splitArg(args.status, v.number());
      const priorityId = args.priority
        ? args.priority
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((name) => {
              const id = PriorityId[name.toLowerCase()];
              if (id === undefined) {
                throw new Error(
                  `Unknown priority "${name}". Valid values: ${PRIORITY_NAMES.join(", ")}`,
                );
              }
              return id;
            })
        : [];

      const result = await client.getIssuesCount({
        projectId,
        assigneeId,
        statusId,
        priorityId,
        keyword: args.keyword,
        createdSince: args["created-since"],
        createdUntil: args["created-until"],
        updatedSince: args["updated-since"],
        updatedUntil: args["updated-until"],
        dueDateSince: args["due-since"],
        dueDateUntil: args["due-until"],
      });

      outputResult(result, args, (data) => {
        consola.log(data.count);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, count };
