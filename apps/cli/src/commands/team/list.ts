import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List teams")
  .description(
    `List teams in the space.

Teams are groups of users that can be assigned to projects collectively.
Use \`--order\` to control sort direction and \`--offset\` / \`--count\` for
pagination.`,
  )
  .addOption(opt.json())
  .addOption(opt.order())
  .addOption(opt.offset())
  .addOption(opt.count())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List all teams", command: "bee team list" },
    { description: "List teams in descending order", command: "bee team list --order desc" },
    { description: "Output as JSON", command: "bee team list --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const order = v.parse(v.optional(v.picklist(["asc", "desc"])), opts.order);
    const offset = v.parse(v.optional(v.pipe(v.string(), v.transform(Number))), opts.offset);
    const count = v.parse(v.optional(v.pipe(v.string(), v.transform(Number))), opts.count);

    const teams = await client.getTeams({ order, offset, count });

    outputResult(teams, opts, (data) => {
      if (data.length === 0) {
        consola.info("No teams found.");
        return;
      }

      const rows: Row[] = data.map((t) => [
        { header: "ID", value: String(t.id) },
        { header: "NAME", value: t.name },
        { header: "MEMBERS", value: String(t.members.length) },
      ]);

      printTable(rows);
    });
  });

export default list;
