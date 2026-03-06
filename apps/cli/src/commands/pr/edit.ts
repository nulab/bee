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
import * as commonArgs from "../../lib/common-args";
import { resolveUserId } from "../../lib/resolve-user";

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
      project: { ...commonArgs.project, required: true },
      repo: commonArgs.repo,
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
        ...commonArgs.assignee,
        alias: undefined,
        description: "New assignee user ID. Use @me for yourself.",
      },
      issue: {
        type: "string",
        description: "New related issue ID or issue key",
        valueHint: "<PROJECT-123>",
      },
      comment: commonArgs.comment,
      notify: commonArgs.notify,
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
        assigneeId: args.assignee ? await resolveUserId(client, args.assignee) : undefined,
        // @ts-expect-error backlog-js types say string[] but Backlog API accepts a single string
        comment: args.comment ?? undefined,
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
