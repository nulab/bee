import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Delete an issue type from a Backlog project.

When deleting an issue type, all issues of that type must be reassigned
to another issue type. Use \`--substitute-issue-type-id\` to specify
the replacement.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,

  examples: [
    {
      description: "Delete an issue type",
      command: "bee issue-type delete 12345 -p PROJECT --substitute-issue-type-id 67890",
    },
    {
      description: "Delete without confirmation",
      command: "bee issue-type delete 12345 -p PROJECT --substitute-issue-type-id 67890 --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const deleteIssueType = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete an issue type",
    },
    args: {
      ...outputArgs,
      issueType: {
        type: "positional",
        description: "Issue type ID",
        required: true,
        valueHint: "<number>",
      },
      project: { ...commonArgs.project, required: true },
      "substitute-issue-type-id": {
        type: "string",
        description: "Replacement issue type ID for affected issues",
        valueHint: "<number>",
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
        `Are you sure you want to delete issue type ${args.issueType}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const issueType = await client.deleteIssueType(args.project, Number(args.issueType), {
        substituteIssueTypeId: Number(args["substitute-issue-type-id"]),
      });

      outputResult(issueType, args, (data) => {
        consola.success(`Deleted issue type ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteIssueType };
