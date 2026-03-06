import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, resolveStdinArg, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Add a comment to a Backlog issue.

The comment body is required. When input is piped, it is used as the body
automatically.`,

  examples: [
    {
      description: "Add a comment",
      command: 'bee issue comment PROJECT-123 -b "This is a comment"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee issue comment PROJECT-123',
    },
    {
      description: "Add a comment and notify users",
      command: 'bee issue comment PROJECT-123 -b "FYI" --notify 12345,67890',
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
        required: true,
      },
      notify: {
        type: "string",
        description: "User IDs to notify (comma-separated for multiple)",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const content = (await resolveStdinArg(args.body)) ?? args.body;
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
