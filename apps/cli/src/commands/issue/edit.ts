import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";
import { PRIORITY_NAMES, PriorityId } from "../../lib/issue-constants";

const commandUsage: CommandUsage = {
  long: `Update an existing Backlog issue.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,

  examples: [
    {
      description: "Update issue title",
      command: 'bee issue edit PROJECT-123 -t "New title"',
    },
    {
      description: "Change assignee and priority",
      command: "bee issue edit PROJECT-123 --assignee 12345 --priority high",
    },
    {
      description: "Add a comment with the update",
      command: 'bee issue edit PROJECT-123 -t "New title" --comment "Updated title"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit an issue",
    },
    args: {
      ...outputArgs,
      issue: {
        type: "positional",
        description: "Issue ID or issue key",
        valueHint: "<PROJECT-123>",
        required: true,
      },
      title: {
        type: "string",
        alias: "t",
        description: "New title of the issue",
      },
      description: {
        type: "string",
        alias: "d",
        description: "New description of the issue",
      },
      status: {
        type: "string",
        alias: "S",
        description: "New status ID",
      },
      priority: {
        type: "string",
        alias: "P",
        description: "Change priority",
        valueHint: `{${PRIORITY_NAMES.join("|")}}`,
      },
      type: {
        type: "string",
        alias: "T",
        description: "New issue type ID",
        valueHint: "<number>",
      },
      assignee: {
        ...commonArgs.assignee,
        alias: undefined,
        description: "New assignee user ID. Use @me for yourself.",
      },
      resolution: {
        type: "string",
        description: "Resolution ID",
      },
      "parent-issue": {
        type: "string",
        description: "New parent issue ID",
      },
      "start-date": {
        type: "string",
        description: "New start date",
        valueHint: "<yyyy-MM-dd>",
      },
      "due-date": {
        type: "string",
        description: "New due date",
        valueHint: "<yyyy-MM-dd>",
      },
      "estimated-hours": {
        type: "string",
        description: "New estimated hours",
      },
      "actual-hours": {
        type: "string",
        description: "New actual hours",
      },
      comment: commonArgs.comment,
      notify: commonArgs.notify,
      attachment: commonArgs.attachment,
    },
    async run({ args }) {
      const { client } = await getClient();

      const notifiedUserId = splitArg(args.notify, v.number());
      const attachmentId = splitArg(args.attachment, v.number());

      let priorityId: number | undefined;
      if (args.priority) {
        priorityId = PriorityId[args.priority.toLowerCase()];
        if (priorityId === undefined) {
          throw new Error(
            `Unknown priority "${args.priority}". Valid values: ${PRIORITY_NAMES.join(", ")}`,
          );
        }
      }

      const issue = await client.patchIssue(args.issue, {
        summary: args.title,
        description: args.description,
        statusId: args.status ? Number(args.status) : undefined,
        priorityId,
        issueTypeId: args.type ? Number(args.type) : undefined,
        assigneeId: args.assignee ? Number(args.assignee) : undefined,
        resolutionId: args.resolution ? Number(args.resolution) : undefined,
        parentIssueId: args["parent-issue"] ? Number(args["parent-issue"]) : undefined,
        startDate: args["start-date"],
        dueDate: args["due-date"],
        estimatedHours: args["estimated-hours"] ? Number(args["estimated-hours"]) : undefined,
        actualHours: args["actual-hours"] ? Number(args["actual-hours"]) : undefined,
        comment: args.comment,
        notifiedUserId,
        attachmentId,
      });

      outputResult(issue, args, (data) => {
        consola.success(`Updated issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
