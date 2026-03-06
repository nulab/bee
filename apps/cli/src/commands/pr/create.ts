import { getClient, resolveUserId } from "@repo/backlog-utils";
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
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Create a new pull request in a Backlog repository.

Requires a base branch, head branch, title, and description. When run
interactively, omitted required fields will be prompted.`,

  examples: [
    {
      description: "Create a pull request",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Add login" -b "Details"',
    },
    {
      description: "Create a pull request assigned to yourself",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Title" -b "Desc" --assignee @me',
    },
    {
      description: "Create a pull request linked to an issue",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Title" -b "Desc" --issue 123',
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
      project: { ...commonArgs.project, required: true },
      repo: commonArgs.repo,
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
        description: "Pull request title",
      },
      body: {
        type: "string",
        alias: "b",
        description: "Pull request description",
      },
      assignee: commonArgs.assignee,
      issue: {
        type: "string",
        description: "Related issue ID or issue key",
        valueHint: "<PROJECT-123>",
      },
      notify: commonArgs.notify,
      attachment: commonArgs.attachment,
    },
    async run({ args }) {
      const { client } = await getClient();

      const base = await promptRequired("Base branch:", args.base);
      const head = await promptRequired("Head branch:", args.head);
      const summary = await promptRequired("Summary:", args.title);
      const description = await promptRequired("Body:", args.body);

      const assigneeId = args.assignee ? await resolveUserId(client, args.assignee) : undefined;
      const notifiedUserId = splitArg(args.notify, v.number());
      const attachmentId = splitArg(args.attachment, v.number());

      let issueId: number | undefined;
      if (args.issue) {
        if (Number.isNaN(Number(args.issue))) {
          const issue = await client.getIssue(args.issue);
          issueId = issue.id;
        } else {
          issueId = Number(args.issue);
        }
      }

      const pullRequest = await client.postPullRequest(args.project, args.repo, {
        summary,
        description,
        base,
        branch: head,
        issueId,
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
