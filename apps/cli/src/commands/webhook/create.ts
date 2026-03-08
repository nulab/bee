import { getClient } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { collectNum } from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const create = new BeeCommand("create")
  .summary("Create a webhook")
  .description(
    `Create a new webhook in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.

Either \`--all-event\` or \`--activity-type-ids\` must be specified. Use
\`--all-event\` to subscribe to all activity types, or specify individual
activity type IDs with \`--activity-type-ids\`.`,
  )
  .addOption(opt.project())
  .option("-n, --name <name>", "Webhook name")
  .requiredOption("--hook-url <url>", "URL to receive webhook notifications")
  .option("--all-event", "Subscribe to all event types")
  .option(
    "--activity-type-ids <id>",
    "Activity type IDs to subscribe to (repeatable)",
    collectNum,
    [] as number[],
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
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
        "bee webhook create -p PROJECT -n CI --hook-url https://example.com/hook --activity-type-ids 1 --activity-type-ids 2 --activity-type-ids 3",
    },
  ])
  .action(async (_opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client } = await getClient();

    const name = await promptRequired("Webhook name:", opts.name as string | undefined);
    const activityTypeIds: number[] = (opts.activityTypeIds as number[]) ?? [];

    const webhook = await client.postWebhook(opts.project as string, {
      name,
      hookUrl: opts.hookUrl as string,
      allEvent: opts.allEvent as boolean | undefined,
      activityTypeIds,
    });

    const json = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(webhook, { json }, (data) => {
      consola.success(`Created webhook ${data.name} (ID: ${data.id})`);
    });
  });

export default create;
