import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List statuses")
  .description(`Statuses define the workflow states that issues move through.`)
  .addOption(opt.project())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all statuses", command: "bee status list -p PROJECT" },
    { description: "Output as JSON", command: "bee status list -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const statuses = await client.getProjectStatuses(opts.project);

    outputResult(statuses, opts, (data) => {
      if (data.length === 0) {
        consola.info("No statuses found.");
        return;
      }

      const rows: Row[] = data.map((s) => [
        { header: "ID", value: String(s.id) },
        { header: "NAME", value: s.name },
        { header: "COLOR", value: s.color },
      ]);

      printTable(rows);
    });
  });

export default list;
