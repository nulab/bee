import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, readStdin } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Add a comment to a Backlog issue.

The comment body is required. Use "-b -" to read the body from stdin.`,

  examples: [
    {
      description: "Add a comment",
      command: 'bee issue comment PROJECT-123 -b "This is a comment"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee issue comment PROJECT-123 -b -',
    },
  ],
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
        description: "Issue ID or issue key. e.g., PROJECT-123",
        required: true,
      },
      body: {
        type: "string",
        alias: "b",
        description: "Comment body. Use - to read from stdin.",
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const content = args.body === "-" ? await readStdin() : args.body;

      const result = await client.postIssueComments(args.issue, { content });

      outputResult(result, args, () => {
        consola.success(`Added comment to ${args.issue}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, comment };
