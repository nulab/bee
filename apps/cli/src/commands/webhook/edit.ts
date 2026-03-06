import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Update an existing webhook in a Backlog project.

All fields are optional. Only the specified fields will be updated.`,

  examples: [
    {
      description: "Rename a webhook",
      command: 'bee webhook edit 12345 -p PROJECT -n "New Name"',
    },
    {
      description: "Update the hook URL",
      command: "bee webhook edit 12345 -p PROJECT --hook-url https://example.com/new-hook",
    },
    {
      description: "Subscribe to all events",
      command: "bee webhook edit 12345 -p PROJECT --all-event",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit a webhook",
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
      name: {
        type: "string",
        alias: "n",
        description: "New name of the webhook",
      },
      "hook-url": {
        type: "string",
        description: "New URL to receive webhook notifications",
      },
      "all-event": {
        type: "boolean",
        description: "Change whether to subscribe to all event types",
      },
      "activity-type-ids": {
        type: "string",
        description: "New activity type IDs to subscribe to",
        valueHint: "<1,2,3,...>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const activityTypeIds = splitArg(args["activity-type-ids"], v.number());

      const webhook = await client.patchWebhook(args.project, args.webhook, {
        name: args.name,
        hookUrl: args["hook-url"],
        allEvent: args["all-event"],
        activityTypeIds,
      });

      outputResult(webhook, args, (data) => {
        consola.success(`Updated webhook ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
