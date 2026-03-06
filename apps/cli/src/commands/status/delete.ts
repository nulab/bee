import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Delete a status from a Backlog project.

When deleting a status, all issues with that status must be reassigned
to another status. Use \`--substitute-status-id\` to specify
the replacement.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,

  examples: [
    {
      description: "Delete a status",
      command: "bee status delete 12345 -p PROJECT --substitute-status-id 67890",
    },
    {
      description: "Delete without confirmation",
      command: "bee status delete 12345 -p PROJECT --substitute-status-id 67890 --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const deleteStatus = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete a status",
    },
    args: {
      ...outputArgs,
      status: {
        type: "positional",
        description: "Status ID",
        required: true,
        valueHint: "<number>",
      },
      project: { ...commonArgs.project, required: true },
      "substitute-status-id": {
        type: "string",
        description: "Replacement status ID for affected issues",
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
        `Are you sure you want to delete status ${args.status}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const status = await client.deleteProjectStatus(
        args.project,
        Number(args.status),
        Number(args["substitute-status-id"]),
      );

      outputResult(status, args, (data) => {
        consola.success(`Deleted status ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteStatus };
