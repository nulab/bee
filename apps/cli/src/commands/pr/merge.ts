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
import { PrStatusId } from "../../lib/pr-constants";

const commandUsage: CommandUsage = {
  long: `Merge a Backlog pull request.

Sets the pull request status to Merged. Optionally add a comment.`,

  examples: [
    { description: "Merge a pull request", command: "bee pr merge 42 -p PROJECT -R repo" },
    {
      description: "Merge with a comment",
      command: 'bee pr merge 42 -p PROJECT -R repo -c "LGTM, merging"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const merge = withUsage(
  defineCommand({
    meta: {
      name: "merge",
      description: "Merge a pull request",
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
        description: "Repository name",
        default: process.env.BACKLOG_REPO,
        required: true,
      },
      comment: {
        type: "string",
        alias: "c",
        description: "Comment to add when merging",
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

      const pullRequest = await client.patchPullRequest(args.project, args.repo, prNumber, {
        statusId: PrStatusId.Merged,
        comment: args.comment ? [args.comment] : undefined,
        notifiedUserId,
      } as never);

      outputResult(pullRequest, args, (data) => {
        consola.success(`Merged pull request #${data.number}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, merge };
