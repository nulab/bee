import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Create a new webhook in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.

Either \`--all-event\` or \`--activity-type-ids\` must be specified. Use
\`--all-event\` to subscribe to all activity types, or specify individual
activity type IDs with \`--activity-type-ids\`.`,

  examples: [
    {
      description: "Create a webhook",
      command: 'bee webhook create -p PROJECT -n "Deploy Hook" --hook-url https://example.com/hook',
    },
    {
      description: "Create a webhook for all events",
      command:
        "bee webhook create -p PROJECT -n CI --hook-url https://example.com/hook --all-event",
    },
    {
      description: "Create a webhook for specific activity types",
      command:
        "bee webhook create -p PROJECT -n CI --hook-url https://example.com/hook --activity-type-ids 1,2,3",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create a webhook",
    },
    args: {
      ...outputArgs,
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "Webhook name",
      },
      "hook-url": {
        type: "string",
        description: "URL to receive webhook notifications",
        required: true,
      },
      "all-event": {
        type: "boolean",
        description: "Subscribe to all event types",
      },
      "activity-type-ids": {
        type: "string",
        description: "Activity type IDs to subscribe to",
        valueHint: "<1,2,3,...>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const name = await promptRequired("Webhook name:", args.name);
      const activityTypeIds = splitArg(args["activity-type-ids"], v.number());

      const webhook = await client.postWebhook(args.project, {
        name,
        hookUrl: args["hook-url"],
        allEvent: args["all-event"],
        activityTypeIds,
      });

      outputResult(webhook, args, (data) => {
        consola.success(`Created webhook ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
