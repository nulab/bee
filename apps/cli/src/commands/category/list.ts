import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List categories")
  .description(
    `List categories in a Backlog project.

Categories help organize issues by grouping them into logical areas.`,
  )
  .argument("[project]", "Project ID or project key")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all categories in a project", command: "bee category list PROJECT" },
    { description: "Output as JSON", command: "bee category list PROJECT --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const categories = await client.getCategories(project);

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
