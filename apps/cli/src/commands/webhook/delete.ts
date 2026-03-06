import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Delete a webhook from a Backlog project.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,

  examples: [
    {
      description: "Delete a webhook (with confirmation)",
      command: "bee webhook delete 12345 -p PROJECT",
    },
    {
      description: "Delete without confirmation",
      command: "bee webhook delete 12345 -p PROJECT --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const deleteWebhook = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete a webhook",
    },
    args: {
      ...outputArgs,
      webhook: {
        type: "positional",
        description: "Webhook ID",
        required: true,
        valueHint: "<number>",
      },
      project: { ...commonArgs.project, required: true },
      yes: {
        type: "boolean",
        alias: "y",
        description: "Skip confirmation prompt",
      },
    },
    async run({ args }) {
      const confirmed = await confirmOrExit(
        `Are you sure you want to delete webhook ${args.webhook}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const webhook = await client.deleteWebhook(args.project, args.webhook);

      outputResult(webhook, args, (data) => {
        consola.success(`Deleted webhook ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteWebhook };
