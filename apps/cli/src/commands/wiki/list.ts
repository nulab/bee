import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List wiki pages")
  .description(
    `List wiki pages in a Backlog project.

Use \`--keyword\` to filter pages by name or content.`,
  )
  .argument("<project>", "Project ID or project key")
  .addOption(opt.keyword())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all wiki pages in a project", command: "bee wiki list PROJECT" },
    {
      description: "Search wiki pages by keyword",
      command: 'bee wiki list PROJECT --keyword "setup"',
    },
    { description: "Output as JSON", command: "bee wiki list PROJECT --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const wikis = await client.getWikis({
      projectIdOrKey: project,
      keyword: opts.keyword,
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(wikis, { json }, (data) => {
      if (data.length === 0) {
        consola.info("No wiki pages found.");
        return;
      }

      const rows: Row[] = data.map((wiki) => [
        { header: "ID", value: String(wiki.id) },
        { header: "NAME", value: wiki.name },
        { header: "UPDATED", value: wiki.updated.slice(0, 10) },
      ]);

      printTable(rows);
    });
  });

export default list;
