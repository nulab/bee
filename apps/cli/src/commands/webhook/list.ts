import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List webhooks")
  .description(
    `List webhooks in a Backlog project.

Webhooks allow external services to receive notifications when events occur
in a project.`,
  )
  .addOption(opt.project())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all webhooks in a project", command: "bee webhook list -p PROJECT" },
    { description: "Output as JSON", command: "bee webhook list -p PROJECT --json" },
  ])
  .action(async (_opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client } = await getClient();

    const webhooks = await client.getWebhooks(opts.project as string);

    const json = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(webhooks, { json }, (data) => {
      if (data.length === 0) {
        consola.info("No webhooks found.");
        return;
      }

      const rows: Row[] = data.map(
        (w: { id: number; name: string; hookUrl: string; allEvent: boolean }) => [
          { header: "ID", value: String(w.id) },
          { header: "NAME", value: w.name },
          { header: "HOOK URL", value: w.hookUrl },
          { header: "ALL EVENT", value: w.allEvent ? "Yes" : "No" },
        ],
      );

      printTable(rows);
    });
  });

export default list;
