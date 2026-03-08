import { getClient } from "@repo/backlog-utils";
import { UserError } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Add a star to an issue, comment, wiki page, or pull request comment.

Exactly one of \`--issue\`, \`--comment\`, \`--wiki\`, or \`--pr-comment\` must be
provided. The \`--issue\` flag accepts an issue key (e.g., PROJECT-123) or a
numeric ID. Other flags require numeric IDs.`,

  examples: [
    { description: "Star an issue by key", command: "bee star add --issue PROJECT-123" },
    { description: "Star an issue by ID", command: "bee star add --issue 12345" },
    { description: "Star a comment", command: "bee star add --comment 67890" },
    { description: "Star a wiki page", command: "bee star add --wiki 111" },
    { description: "Star a pull request comment", command: "bee star add --pr-comment 222" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const add = withUsage(
  defineCommand({
    meta: {
      name: "add",
      description: "Add a star",
    },
    args: {
      issue: commonArgs.issue,
      comment: {
        type: "string",
        description: "Comment ID to star",
        valueHint: "<number>",
      },
      wiki: {
        type: "string",
        description: "Wiki page ID to star",
        valueHint: "<number>",
      },
      "pr-comment": {
        type: "string",
        description: "Pull request comment ID to star",
        valueHint: "<number>",
      },
    },
    async run({ args }) {
      const flags = [args.issue, args.comment, args.wiki, args["pr-comment"]].filter(
        (v) => v !== undefined,
      );

      if (flags.length === 0) {
        throw new UserError(
          "Exactly one of --issue, --comment, --wiki, or --pr-comment must be provided.",
        );
      }

      if (flags.length > 1) {
        throw new UserError(
          "Only one of --issue, --comment, --wiki, or --pr-comment can be provided at a time.",
        );
      }

      const { client } = await getClient();

      if (args.issue) {
        const issue = /^\d+$/.test(args.issue)
          ? { id: Number(args.issue) }
          : await client.getIssue(args.issue);
        const issueId = issue.id;
        await client.postStar({ issueId });
        consola.success(`Starred issue ${args.issue}.`);
      } else if (args.comment) {
        await client.postStar({ commentId: Number(args.comment) });
        consola.success(`Starred comment ${args.comment}.`);
      } else if (args.wiki) {
        await client.postStar({ wikiId: Number(args.wiki) });
        consola.success(`Starred wiki ${args.wiki}.`);
      } else if (args["pr-comment"]) {
        await client.postStar({ pullRequestCommentId: Number(args["pr-comment"]) });
        consola.success(`Starred pull request comment ${args["pr-comment"]}.`);
      }
    },
  }),
  commandUsage,
);

export { add, commandUsage };
