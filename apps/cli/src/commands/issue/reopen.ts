import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const OPEN_STATUS_ID = 1;

const commandUsage: CommandUsage = {
  long: `Reopen a closed Backlog issue by setting its status back to "Open".

Optionally add a comment with the --comment flag.`,

  examples: [
    { description: "Reopen an issue", command: "bee issue reopen PROJECT-123" },
    {
      description: "Reopen with a comment",
      command: 'bee issue reopen PROJECT-123 -c "Reopening due to regression"',
    },
  ],
};

const reopen = withUsage(
  defineCommand({
    meta: {
      name: "reopen",
      description: "Reopen an issue",
    },
    args: {
      ...outputArgs,
      issue: {
        type: "positional",
        description: "Issue ID or issue key. e.g., PROJECT-123",
        required: true,
      },
      comment: {
        type: "string",
        alias: "c",
        description: "Comment to add when reopening",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const issue = await client.patchIssue(args.issue, {
        statusId: OPEN_STATUS_ID,
        comment: args.comment,
      });

      outputResult(issue, args, (data) => {
        consola.success(`Reopened issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, reopen };
