import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  confirmOrExit,
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
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Add a comment to a Backlog issue.

The comment body is required when adding a comment. When input is piped,
it is used as the body automatically.

Use \`--list\` to list all comments on an issue.
Use \`--edit-last\` to edit your most recent comment.
Use \`--delete-last\` to delete your most recent comment.`,

  examples: [
    {
      description: "Add a comment",
      command: 'bee issue comment PROJECT-123 -b "This is a comment"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee issue comment PROJECT-123',
    },
    { description: "List all comments", command: "bee issue comment PROJECT-123 --list" },
    {
      description: "Edit your last comment",
      command: 'bee issue comment PROJECT-123 --edit-last -b "Updated text"',
    },
    {
      description: "Delete your last comment",
      command: "bee issue comment PROJECT-123 --delete-last --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const comment = withUsage(
  defineCommand({
    meta: {
      name: "comment",
      description: "Add a comment to an issue",
    },
    args: {
      ...outputArgs,
      issue: {
        type: "positional",
        description: "Issue ID or issue key",
        valueHint: "<PROJECT-123>",
        required: true,
      },
      body: {
        type: "string",
        alias: "b",
        description: "Comment body",
      },
      notify: commonArgs.notify,
      list: {
        type: "boolean",
        description: "List comments on the issue",
      },
      "edit-last": {
        type: "boolean",
        description: "Edit your most recent comment",
      },
      "delete-last": {
        type: "boolean",
        description: "Delete your most recent comment",
      },
      yes: {
        type: "boolean",
        description: "Skip confirmation prompt for delete",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      if (args.list) {
        const comments = await client.getIssueComments(args.issue, { order: "asc" });

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
        const comments = await client.getIssueComments(args.issue, { order: "desc" });
        const myComment = comments.find((c) => c.createdUser.id === myself.id);

        if (!myComment) {
          consola.error(`No comment by you was found on ${args.issue}.`);
          return;
        }

        const content = (await resolveStdinArg(args.body)) ?? args.body;
        if (!content) {
          consola.error("Comment body is required. Use --body or pipe input.");
          return;
        }

        const result = await client.patchIssueComment(args.issue, myComment.id, { content });

        outputResult(result, args, () => {
          consola.success(`Updated comment on ${args.issue}`);
        });
        return;
      }

      if (args["delete-last"]) {
        const myself = await client.getMyself();
        const comments = await client.getIssueComments(args.issue, { order: "desc" });
        const myComment = comments.find((c) => c.createdUser.id === myself.id);

        if (!myComment) {
          consola.error(`No comment by you was found on ${args.issue}.`);
          return;
        }

        const confirmed = await confirmOrExit(
          `Are you sure you want to delete your comment on ${args.issue}?`,
          args.yes,
        );
        if (!confirmed) {
          return;
        }

        const result = await client.deleteIssueComment(args.issue, myComment.id);

        outputResult(result, args, () => {
          consola.success(`Deleted comment on ${args.issue}`);
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

      const result = await client.postIssueComments(args.issue, {
        content,
        notifiedUserId,
      });

      outputResult(result, args, () => {
        consola.success(`Added comment to ${args.issue}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, comment };
