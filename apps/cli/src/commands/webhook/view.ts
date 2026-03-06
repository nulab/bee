import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog webhook.

Shows the webhook name, ID, hook URL, description, and activity type IDs.`,

  examples: [
    { description: "View a webhook", command: "bee webhook view 12345 -p PROJECT" },
    { description: "Output as JSON", command: "bee webhook view 12345 -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a webhook",
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
    },
    async run({ args }) {
      const { client } = await getClient();

      const webhook = await client.getWebhook(args.project, args.webhook);

      outputResult(webhook, args, (data) => {
        consola.log("");
        consola.log(`  ${data.name}`);
        consola.log("");
        printDefinitionList([
          ["ID", String(data.id)],
          ["Hook URL", data.hookUrl],
          ["Description", data.description || undefined],
          ["All Event", data.allEvent ? "Yes" : "No"],
          [
            "Activity Type IDs",
            data.activityTypeIds?.length > 0 ? data.activityTypeIds.join(", ") : undefined,
          ],
        ]);
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
