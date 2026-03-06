import { getClient } from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Add a star to an issue, comment, wiki page, or pull request comment.

Exactly one of \`--issue\`, \`--comment\`, \`--wiki\`, or \`--pr-comment\` must be
provided. Use the corresponding resource ID as the value.`,

  examples: [
    { description: "Star an issue", command: "bee star add --issue 12345" },
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
      issue: {
        type: "string",
        description: "Issue ID to star",
        valueHint: "<number>",
      },
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
        consola.error(
          "Exactly one of --issue, --comment, --wiki, or --pr-comment must be provided.",
        );
        process.exit(1);
      }

      if (flags.length > 1) {
        consola.error(
          "Only one of --issue, --comment, --wiki, or --pr-comment can be provided at a time.",
        );
        process.exit(1);
      }

      const { client } = await getClient();

      if (args.issue) {
        await client.postStar({ issueId: Number(args.issue) });
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
