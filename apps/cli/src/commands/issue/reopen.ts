import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, withUsage } from "../../lib/command-usage";
import { IssueStatusId } from "../../lib/issue-constants";

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
        description: "Issue ID or issue key",
        valueHint: "<PROJECT-123>",
        required: true,
      },
      comment: {
        type: "string",
        alias: "c",
        description: "Comment to add when reopening",
      },
      notify: {
        type: "string",
        description: "User IDs to notify (comma-separated for multiple)",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const notifiedUserId = splitArg(args.notify, v.number());

      const issue = await client.patchIssue(args.issue, {
        statusId: IssueStatusId.Open,
        comment: args.comment,
        notifiedUserId,
      });

      outputResult(issue, args, (data) => {
        consola.success(`Reopened issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, reopen };
