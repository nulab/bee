import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const deleteWebhook = new BeeCommand("delete")
  .summary("Delete a webhook")
  .description(
    `Delete a webhook from a Backlog project.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,
  )
  .argument("<webhook>", "Webhook ID")
  .addOption(opt.project())
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Delete a webhook (with confirmation)",
      command: "bee webhook delete 12345 -p PROJECT",
    },
    {
      description: "Delete without confirmation",
      command: "bee webhook delete 12345 -p PROJECT --yes",
    },
  ])
  .action(async (webhook, _opts, cmd) => {
    const opts = await resolveOptions(cmd);

    const confirmed = await confirmOrExit(
      `Are you sure you want to delete webhook ${webhook}? This cannot be undone.`,
      opts.yes as boolean | undefined,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient();

    const webhookData = await client.deleteWebhook(opts.project as string, webhook);

    const json = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(webhookData, { json }, (data) => {
      consola.success(`Deleted webhook ${data.name} (ID: ${data.id})`);
    });
  });

export default deleteWebhook;
