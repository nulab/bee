import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List categories")
  .description(`Categories help organize issues by grouping them into logical areas.`)
  .addOption(opt.project())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all categories in a project", command: "bee category list -p PROJECT" },
    { description: "Output as JSON", command: "bee category list -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const categories = await client.getCategories(opts.project);

    outputResult(categories, opts, (data) => {
      if (data.length === 0) {
        consola.info("No categories found.");
        return;
      }

      const rows: Row[] = data.map((c) => [
        { header: "ID", value: String(c.id) },
        { header: "NAME", value: c.name },
      ]);

      printTable(rows);
    });
  });

export default list;
