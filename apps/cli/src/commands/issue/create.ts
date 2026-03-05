import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog issue.

Requires a project, summary, issue type, and priority. When run
interactively, omitted required fields will be prompted.

Issue type and priority accept numeric IDs. Use "bee issue list" to find
valid values for your project.`,

  examples: [
    {
      description: "Create an issue with required fields",
      command: 'bee issue create -p PROJECT --type 1 --priority 3 -t "Fix login bug"',
    },
    {
      description: "Create an issue with description",
      command: 'bee issue create -p PROJECT --type 1 --priority 3 -t "Title" -d "Details here"',
    },
    {
      description: "Create an issue with assignee and due date",
      command:
        'bee issue create -p PROJECT --type 1 --priority 3 -t "Title" --assignee 12345 --due-date 2025-12-31',
    },
    {
      description: "Output as JSON",
      command: 'bee issue create -p PROJECT --type 1 --priority 3 -t "Title" --json',
    },
  ],

  annotations: {
    environment: [["BACKLOG_PROJECT", "Default project ID or project key"]],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create an issue",
    },
    args: {
      ...outputArgs,
      project: {
        type: "string",
        alias: "p",
        description: "Project ID or project key",
        default: process.env.BACKLOG_PROJECT,
      },
      title: {
        type: "string",
        alias: "t",
        description: "Issue summary",
      },
      type: {
        type: "string",
        alias: "T",
        description: "Issue type ID",
      },
      priority: {
        type: "string",
        alias: "P",
        description: "Priority ID",
      },
      description: {
        type: "string",
        alias: "d",
        description: "Issue description",
      },
      assignee: {
        type: "string",
        description: "Assignee user ID",
      },
      "parent-issue": {
        type: "string",
        description: "Parent issue ID",
      },
      "start-date": {
        type: "string",
        description: "Start date (yyyy-MM-dd)",
      },
      "due-date": {
        type: "string",
        description: "Due date (yyyy-MM-dd)",
      },
      "estimated-hours": {
        type: "string",
        description: "Estimated hours",
      },
      "actual-hours": {
        type: "string",
        description: "Actual hours",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const project = await promptRequired("Project:", args.project);
      const title = await promptRequired("Summary:", args.title);
      const issueTypeId = await promptRequired("Issue type ID:", args.type);
      const priorityId = await promptRequired("Priority ID:", args.priority);

      const issue = await client.postIssue({
        projectId: Number(project),
        summary: title,
        issueTypeId: Number(issueTypeId),
        priorityId: Number(priorityId),
        description: args.description,
        assigneeId: args.assignee ? Number(args.assignee) : undefined,
        parentIssueId: args["parent-issue"] ? Number(args["parent-issue"]) : undefined,
        startDate: args["start-date"],
        dueDate: args["due-date"],
        estimatedHours: args["estimated-hours"] ? Number(args["estimated-hours"]) : undefined,
        actualHours: args["actual-hours"] ? Number(args["actual-hours"]) : undefined,
      });

      outputResult(issue, args, (data) => {
        consola.success(`Created issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
