import { getClient } from "@repo/backlog-utils";
import { outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const view = new BeeCommand("view")
  .summary("View a webhook")
  .description(
    `Display details of a Backlog webhook.

Shows the webhook name, ID, hook URL, description, and activity type IDs.`,
  )
  .argument("<webhook>", "Webhook ID")
  .addOption(opt.project())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "View a webhook", command: "bee webhook view 12345 -p PROJECT" },
    { description: "Output as JSON", command: "bee webhook view 12345 -p PROJECT --json" },
  ])
  .action(async (webhook, _opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client } = await getClient();

    const webhookData = await client.getWebhook(opts.project as string, webhook);

    const json = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(webhookData, { json }, (data) => {
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
  });

export default view;
