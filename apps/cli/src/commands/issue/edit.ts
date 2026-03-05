import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, withUsage } from "../../lib/command-usage";
import { PRIORITY_NAMES, PriorityId } from "../../lib/issue-constants";

const commandUsage: CommandUsage = {
  long: `Update an existing Backlog issue.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,

  examples: [
    {
      description: "Update issue summary",
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
        description: "Issue ID or issue key. e.g., PROJECT-123",
        required: true,
      },
      title: {
        type: "string",
        alias: "t",
        description: "New summary of the issue",
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
        description: `Change priority. {${PRIORITY_NAMES.join("|")}}`,
      },
      type: {
        type: "string",
        alias: "T",
        description: "New issue type ID",
      },
      assignee: {
        type: "string",
        description: "New assignee user ID",
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
        description: "New start date (yyyy-MM-dd)",
      },
      "due-date": {
        type: "string",
        description: "New due date (yyyy-MM-dd)",
      },
      "estimated-hours": {
        type: "string",
        description: "New estimated hours",
      },
      "actual-hours": {
        type: "string",
        description: "New actual hours",
      },
      comment: {
        type: "string",
        alias: "c",
        description: "Comment to add with the update",
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
