import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, readStdin, splitArg } from "@repo/cli-utils";
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

The comment body is required. Use \`-b -\` to read the body from stdin.`,

  examples: [
    {
      description: "Add a comment",
      command: 'bee pr comment 42 -p PROJECT -R repo -b "Looks good!"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee pr comment 42 -p PROJECT -R repo -b -',
    },
    {
      description: "Add a comment and notify users",
      command: 'bee pr comment 42 -p PROJECT -R repo -b "FYI" --notify 12345,67890',
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
        description: "Comment body. Use - to read from stdin.",
        required: true,
      },
      notify: commonArgs.notify,
    },
    async run({ args }) {
      const { client } = await getClient();

      const prNumber = Number(args.number);
      const content = args.body === "-" ? await readStdin() : args.body;
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
