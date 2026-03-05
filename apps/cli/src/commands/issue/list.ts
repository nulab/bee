import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable, splitArg } from "@repo/cli-utils";
import { type Option } from "backlog-js";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import { PRIORITY_NAMES, PriorityId } from "../../lib/issue-constants";
import { resolveProjectIds } from "../../lib/resolve-project";

const commandUsage: CommandUsage = {
  long: `List issues from one or more Backlog projects.

By default, issues are sorted by last updated date in descending order.
Use filtering flags to narrow results by assignee, status, priority, and more.

Multiple project keys can be specified as a comma-separated list.`,

  examples: [
    { description: "List issues in a project", command: "bee issue list -p PROJECT" },
    { description: "List your assigned issues", command: "bee issue list -p PROJECT -a @me" },
    {
      description: "Filter by keyword and priority",
      command: 'bee issue list -p PROJECT -k "login bug" --priority high',
    },
    { description: "Output as JSON", command: "bee issue list -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List issues",
    },
    args: {
      ...outputArgs,
      project: {
        type: "string",
        alias: "p",
        description: "Project ID or project key (comma-separated for multiple)",
        default: process.env.BACKLOG_PROJECT,
      },
      assignee: {
        type: "string",
        alias: "a",
        description: "Assignee user ID (comma-separated for multiple). Use @me for yourself.",
      },
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
      keyword: {
        type: "string",
        alias: "k",
        description: "Keyword search",
      },
      "created-since": {
        type: "string",
        description: "Created since",
        valueHint: "<yyyy-MM-dd>",
      },
      "created-until": {
        type: "string",
        description: "Created until",
        valueHint: "<yyyy-MM-dd>",
      },
      "updated-since": {
        type: "string",
        description: "Updated since",
        valueHint: "<yyyy-MM-dd>",
      },
      "updated-until": {
        type: "string",
        description: "Updated until",
        valueHint: "<yyyy-MM-dd>",
      },
      "due-since": {
        type: "string",
        description: "Due date since",
        valueHint: "<yyyy-MM-dd>",
      },
      "due-until": {
        type: "string",
        description: "Due date until",
        valueHint: "<yyyy-MM-dd>",
      },
      sort: {
        type: "string",
        description: "Sort field",
        valueHint:
          "{issueType|category|version|milestone|summary|status|priority|attachment|sharedFile|created|createdUser|updated|updatedUser|assignee|startDate|dueDate|estimatedHours|actualHours|childIssue}",
      },
      order: {
        type: "string",
        description: "Sort order",
        valueHint: "{asc|desc}",
      },
      count: {
        type: "string",
        alias: "L",
        description: "Number of results (default: 20)",
        valueHint: "<1-100>",
      },
      offset: {
        type: "string",
        description: "Offset for pagination",
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

      const issues = await client.getIssues({
        projectId,
        assigneeId,
        statusId,
        priorityId,
        keyword: args.keyword,
        sort: args.sort as Option.Issue.GetIssuesParams["sort"],
        order: args.order as "asc" | "desc" | undefined,
        count: args.count ? Number(args.count) : undefined,
        offset: args.offset ? Number(args.offset) : undefined,
        createdSince: args["created-since"],
        createdUntil: args["created-until"],
        updatedSince: args["updated-since"],
        updatedUntil: args["updated-until"],
        dueDateSince: args["due-since"],
        dueDateUntil: args["due-until"],
      });

      outputResult(issues, args, (data) => {
        if (data.length === 0) {
          consola.info("No issues found.");
          return;
        }

        const rows: Row[] = data.map((issue) => [
          { header: "KEY", value: issue.issueKey },
          { header: "STATUS", value: issue.status.name },
          { header: "TYPE", value: issue.issueType.name },
          { header: "PRIORITY", value: issue.priority.name },
          { header: "ASSIGNEE", value: issue.assignee?.name ?? "Unassigned" },
          { header: "SUMMARY", value: issue.summary },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
