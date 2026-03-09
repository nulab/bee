import { getClient } from "@repo/backlog-utils";
import { outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const view = new BeeCommand("view")
  .summary("View a team")
  .description(`Shows team details and the list of members.`)
  .argument("<team>", "Team ID")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View team details", command: "bee team view 12345" },
    { description: "Output as JSON", command: "bee team view 12345 --json" },
  ])
  .action(async (team, opts) => {
    const { client } = await getClient(opts.space);

    const t = await client.getTeam(Number(team));

    outputResult(t, opts, (data) => {
      consola.log("");
      consola.log(`  ${data.name}`);
      consola.log("");
      printDefinitionList([
        ["ID", String(data.id)],
        ["Created by", data.createdUser?.name ?? "—"],
        ["Created", data.created],
        ["Updated", data.updated],
        ["Members", String(data.members.length)],
      ]);

      if (data.members.length > 0) {
        consola.log("");
        consola.log("  Members:");
        for (const member of data.members) {
          consola.log(`    - ${member.name} (${member.userId ?? member.id})`);
        }
      }

      consola.log("");
    });
  });

export default view;
