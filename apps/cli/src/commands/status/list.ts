import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List statuses")
  .description(
    `List statuses in a Backlog project.

Statuses define the workflow states that issues can move through.
Each status is displayed with its associated color.`,
  )
  .argument("[project]", "Project ID or project key")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all statuses", command: "bee status list PROJECT" },
    { description: "Output as JSON", command: "bee status list PROJECT --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const statuses = await client.getProjectStatuses(project);

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
