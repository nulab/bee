import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List milestones")
  .description(
    `Milestones (versions) track release schedules and group issues by development cycle.`,
  )
  .addOption(opt.project())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all milestones", command: "bee milestone list -p PROJECT" },
    { description: "Output as JSON", command: "bee milestone list -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const milestones = await client.getVersions(opts.project);

    outputResult(milestones, opts, (data) => {
      if (data.length === 0) {
        consola.info("No milestones found.");
        return;
      }

      const rows: Row[] = data.map((m) => [
        { header: "ID", value: String(m.id) },
        { header: "NAME", value: m.name },
        { header: "START DATE", value: m.startDate?.slice(0, 10) ?? "" },
        { header: "RELEASE DUE DATE", value: m.releaseDueDate?.slice(0, 10) ?? "" },
        { header: "ARCHIVED", value: m.archived ? "Yes" : "No" },
      ]);

      printTable(rows);
    });
  });

export default list;
