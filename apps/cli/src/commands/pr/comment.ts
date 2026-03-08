import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  outputArgs,
  outputResult,
  printTable,
  resolveStdinArg,
  splitArg,
} from "@repo/cli-utils";
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
  long: `Add a comment to a Backlog pull request.

The comment body is required when adding a comment. When input is piped,
it is used as the body automatically.

Use \`--list\` to list all comments on a pull request.
Use \`--edit-last\` to edit your most recent comment.`,

  examples: [
    {
      description: "Add a comment",
      command: 'bee pr comment 42 -p PROJECT -R repo -b "Looks good!"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee pr comment 42 -p PROJECT -R repo',
    },
    { description: "List all comments", command: "bee pr comment 42 -p PROJECT -R repo --list" },
    {
      description: "Edit your last comment",
      command: 'bee pr comment 42 -p PROJECT -R repo --edit-last -b "Updated"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const comment = withUsage(
  defineCommand({
    meta: {
      name: "comment",
      description: "Add a comment to a pull request",
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
      body: {
        type: "string",
        alias: "b",
        description: "Comment body",
      },
      notify: commonArgs.notify,
      list: {
        type: "boolean",
        description: "List comments on the pull request",
      },
      "edit-last": {
        type: "boolean",
        description: "Edit your most recent comment",
      },
    },
    async run({ args }) {
      const { client } = await getClient();
      const prNumber = Number(args.number);

      if (args.list) {
        const comments = await client.getPullRequestComments(args.project, args.repo, prNumber, {
          order: "asc",
        });

        outputResult(comments, args, (data) => {
          const filtered = data.filter((c) => c.content);
          if (filtered.length === 0) {
            consola.info("No comments found.");
            return;
          }

          const rows: Row[] = filtered.map((c) => [
            { header: "ID", value: String(c.id) },
            { header: "AUTHOR", value: c.createdUser.name },
            { header: "DATE", value: formatDate(c.created) },
            { header: "CONTENT", value: c.content! },
          ]);

          printTable(rows);
        });
        return;
      }

      if (args["edit-last"]) {
        const myself = await client.getMyself();
        const comments = await client.getPullRequestComments(args.project, args.repo, prNumber, {
          order: "desc",
        });
        const myComment = comments.find((c) => c.createdUser.id === myself.id);

        if (!myComment) {
          consola.error(`No comment by you was found on pull request #${args.number}.`);
          return;
        }

        const content = (await resolveStdinArg(args.body)) ?? args.body;
        if (!content) {
          consola.error("Comment body is required. Use --body or pipe input.");
          return;
        }

        const result = await client.patchPullRequestComments(
          args.project,
          args.repo,
          prNumber,
          myComment.id,
          { content },
        );

        outputResult(result, args, () => {
          consola.success(`Updated comment on pull request #${args.number}`);
        });
        return;
      }

      // Default: add comment
      const content = (await resolveStdinArg(args.body)) ?? args.body;
      if (!content) {
        consola.error("Comment body is required. Use --body or pipe input.");
        return;
      }
      const notifiedUserId = splitArg(args.notify, v.number());

      const result = await client.postPullRequestComments(args.project, args.repo, prNumber, {
        content,
        notifiedUserId,
      });

      outputResult(result, args, () => {
        consola.success(`Added comment to pull request #${args.number}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, comment };
