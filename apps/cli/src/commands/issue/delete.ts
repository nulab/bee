import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Delete a Backlog issue.

This action is irreversible. You will be prompted for confirmation unless
the --yes flag is provided.`,

  examples: [
    {
      description: "Delete an issue (with confirmation)",
      command: "bee issue delete PROJECT-123",
    },
    {
      description: "Delete an issue without confirmation",
      command: "bee issue delete PROJECT-123 --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const deleteIssue = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete an issue",
    },
    args: {
      ...outputArgs,
      issue: {
        type: "positional",
        description: "Issue ID or issue key",
        valueHint: "<PROJECT-123>",
        required: true,
      },
      yes: {
        type: "boolean",
        alias: "y",
        description: "Skip confirmation prompt",
      },
    },
    async run({ args }) {
      const confirmed = await confirmOrExit(
        `Are you sure you want to delete issue ${args.issue}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const issue = await client.deleteIssue(args.issue);

      outputResult(issue, args, (data) => {
        consola.success(`Deleted issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteIssue };
