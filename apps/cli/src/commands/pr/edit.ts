import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import {
  type CommandUsage,
  ENV_AUTH,
  ENV_PROJECT,
  ENV_REPO,
  withUsage,
} from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Update an existing Backlog pull request.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,

  examples: [
    {
      description: "Update pull request summary",
      command: 'bee pr edit 42 -p PROJECT -R repo -t "New title"',
    },
    {
      description: "Change assignee",
      command: "bee pr edit 42 -p PROJECT -R repo --assignee 12345",
    },
    {
      description: "Add a comment with the update",
      command: 'bee pr edit 42 -p PROJECT -R repo -t "New title" --comment "Updated title"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit a pull request",
    },
    args: {
      ...outputArgs,
      number: {
        type: "positional",
        description: "Pull request number",
        valueHint: "<number>",
        required: true,
      },
      project: {
        type: "string",
        alias: "p",
        description: "Project ID or project key",
        default: process.env.BACKLOG_PROJECT,
        required: true,
      },
      repo: {
        type: "string",
        alias: "R",
        description: "Repository name or ID",
        default: process.env.BACKLOG_REPO,
        required: true,
      },
      title: {
        type: "string",
        alias: "t",
        description: "New summary of the pull request",
      },
      body: {
        type: "string",
        alias: "b",
        description: "New description of the pull request",
      },
      assignee: {
        type: "string",
        description: "New assignee user ID",
      },
      issue: {
        type: "string",
        description: "New related issue ID or issue key",
        valueHint: "<PROJECT-123>",
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
    },
    async run({ args }) {
      const { client } = await getClient();

      const prNumber = Number(args.number);
      const notifiedUserId = splitArg(args.notify, v.number());

      let issueId: number | undefined;
      if (args.issue) {
        if (Number.isNaN(Number(args.issue))) {
          const issue = await client.getIssue(args.issue);
          issueId = issue.id;
        } else {
          issueId = Number(args.issue);
        }
      }

      const pullRequest = await client.patchPullRequest(args.project, args.repo, prNumber, {
        summary: args.title,
        description: args.body,
        issueId,
        assigneeId: args.assignee ? Number(args.assignee) : undefined,
        comment: args.comment ? [args.comment] : undefined,
        notifiedUserId,
      });

      outputResult(pullRequest, args, (data) => {
        consola.success(`Updated pull request #${data.number}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
