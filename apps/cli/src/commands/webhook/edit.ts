import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { collectNum } from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit a webhook")
  .description(
    `Update an existing webhook in a Backlog project.

All fields are optional. Only the specified fields will be updated.`,
  )
  .argument("<webhook>", "Webhook ID")
  .addOption(opt.project())
  .option("-n, --name <name>", "New name of the webhook")
  .option("--hook-url <url>", "New URL to receive webhook notifications")
  .option("--all-event", "Change whether to subscribe to all event types")
  .option(
    "--activity-type-ids <id>",
    "New activity type IDs to subscribe to (repeatable)",
    collectNum,
    [] satisfies number[],
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
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
  ])
  .action(async (webhook, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const activityTypeIds: number[] = opts.activityTypeIds ?? [];

    const webhookData = await client.patchWebhook(opts.project, webhook, {
      name: opts.name,
      hookUrl: opts.hookUrl,
      allEvent: opts.allEvent,
      activityTypeIds,
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(webhookData, { json }, (data) => {
      consola.success(`Updated webhook ${data.name} (ID: ${data.id})`);
    });
  });

export default edit;
