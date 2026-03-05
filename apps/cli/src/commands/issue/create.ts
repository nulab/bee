import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import { PRIORITY_NAMES, PriorityId } from "../../lib/issue-constants";
import { resolveProjectIds } from "../../lib/resolve-project";
import { resolveUserId } from "../../lib/resolve-user";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog issue.

Requires a project, summary, issue type, and priority. When run
interactively, omitted required fields will be prompted.

Issue type accepts a numeric ID. Priority accepts a name: high, normal,
or low.`,

  examples: [
    {
      description: "Create an issue with required fields",
      command: 'bee issue create -p PROJECT --type 1 --priority normal -t "Fix login bug"',
    },
    {
      description: "Create an issue with description",
      command:
        'bee issue create -p PROJECT --type 1 --priority normal -t "Title" -d "Details here"',
    },
    {
      description: "Create an issue assigned to yourself",
      command: 'bee issue create -p PROJECT --type 1 --priority high -t "Title" --assignee @me',
    },
    {
      description: "Output as JSON",
      command: 'bee issue create -p PROJECT --type 1 --priority normal -t "Title" --json',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
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
        description: "Priority",
        valueHint: `{${PRIORITY_NAMES.join("|")}}`,
      },
      description: {
        type: "string",
        alias: "d",
        description: "Issue description",
      },
      assignee: {
        type: "string",
        description: "Assignee user ID. Use @me for yourself.",
      },
      "parent-issue": {
        type: "string",
        description: "Parent issue ID",
      },
      "start-date": {
        type: "string",
        description: "Start date",
        valueHint: "<yyyy-MM-dd>",
      },
      "due-date": {
        type: "string",
        description: "Due date",
        valueHint: "<yyyy-MM-dd>",
      },
      "estimated-hours": {
        type: "string",
        description: "Estimated hours",
      },
      "actual-hours": {
        type: "string",
        description: "Actual hours",
      },
      notify: {
        type: "string",
        description: "User IDs to notify (comma-separated for multiple)",
      },
      attachment: {
        type: "string",
        description: "Attachment IDs (comma-separated for multiple)",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const project = await promptRequired("Project:", args.project);
      const title = await promptRequired("Summary:", args.title);
      const issueTypeId = await promptRequired("Issue type ID:", args.type);
      const priority = await promptRequired("Priority:", args.priority, {
        valueHint: `{${PRIORITY_NAMES.join("|")}}`,
      });
      const priorityId = PriorityId[priority.toLowerCase()];
      if (priorityId === undefined) {
        throw new Error(
          `Unknown priority "${priority}". Valid values: ${PRIORITY_NAMES.join(", ")}`,
        );
      }

      const [projectId] = await resolveProjectIds(client, [project]);
      const assigneeId = args.assignee ? await resolveUserId(client, args.assignee) : undefined;
      const notifiedUserId = splitArg(args.notify, v.number());
      const attachmentId = splitArg(args.attachment, v.number());

      const issue = await client.postIssue({
        projectId,
        summary: title,
        issueTypeId: Number(issueTypeId),
        priorityId,
        description: args.description,
        assigneeId,
        parentIssueId: args["parent-issue"] ? Number(args["parent-issue"]) : undefined,
        startDate: args["start-date"],
        dueDate: args["due-date"],
        estimatedHours: args["estimated-hours"] ? Number(args["estimated-hours"]) : undefined,
        actualHours: args["actual-hours"] ? Number(args["actual-hours"]) : undefined,
        notifiedUserId,
        attachmentId,
      });

      outputResult(issue, args, (data) => {
        consola.success(`Created issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
