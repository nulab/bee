import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired, splitArg } from "@repo/cli-utils";
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
import { resolveUserId } from "../../lib/resolve-user";

const commandUsage: CommandUsage = {
  long: `Create a new pull request in a Backlog repository.

Requires a base branch, head branch, summary, and description. When run
interactively, omitted required fields will be prompted.`,

  examples: [
    {
      description: "Create a pull request",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Add login" -d "Details"',
    },
    {
      description: "Create a pull request assigned to yourself",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Title" -d "Desc" --assignee @me',
    },
    {
      description: "Create a pull request linked to an issue",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Title" -d "Desc" --issue 123',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create a pull request",
    },
    args: {
      ...outputArgs,
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
        description: "Repository name",
        default: process.env.BACKLOG_REPO,
        required: true,
      },
      base: {
        type: "string",
        description: "Base branch name",
      },
      head: {
        type: "string",
        description: "Head branch name",
      },
      title: {
        type: "string",
        alias: "t",
        description: "Pull request summary",
      },
      description: {
        type: "string",
        alias: "d",
        description: "Pull request description",
      },
      assignee: {
        type: "string",
        description: "Assignee user ID. Use @me for yourself.",
      },
      issue: {
        type: "string",
        description: "Related issue ID",
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

      const base = await promptRequired("Base branch:", args.base);
      const head = await promptRequired("Head branch:", args.head);
      const summary = await promptRequired("Summary:", args.title);
      const description = await promptRequired("Description:", args.description);

      const assigneeId = args.assignee ? await resolveUserId(client, args.assignee) : undefined;
      const notifiedUserId = splitArg(args.notify, v.number());
      const attachmentId = splitArg(args.attachment, v.number());

      const pullRequest = await client.postPullRequest(args.project, args.repo, {
        summary,
        description,
        base,
        branch: head,
        issueId: args.issue ? Number(args.issue) : undefined,
        assigneeId,
        notifiedUserId,
        attachmentId,
      });

      outputResult(pullRequest, args, (data) => {
        consola.success(`Created pull request #${data.number}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
