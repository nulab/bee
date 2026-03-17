import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List wiki pages")
  .description(`Use \`--keyword\` to filter pages by name or content.`)
  .addOption(opt.project())
  .addOption(opt.keyword())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all wiki pages in a project", command: "bee wiki list -p PROJECT" },
    {
      description: "Search wiki pages by keyword",
      command: 'bee wiki list -p PROJECT --keyword "setup"',
    },
    { description: "Output as JSON", command: "bee wiki list -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const wikis = await client.getWikis({
      projectIdOrKey: opts.project,
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
