import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const count = new BeeCommand("count")
  .summary("Count wiki pages")
  .description(`Counts all wiki pages regardless of tag or keyword.`)
  .argument("<project>", "Project ID or project key")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Count wiki pages", command: "bee wiki count PROJECT" },
    { description: "Output as JSON", command: "bee wiki count PROJECT --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient(opts.space);

    const result = await client.getWikisCount(project);

    const json = opts.json === true ? "" : opts.json;
    outputResult(result, { json }, (data) => {
      consola.log(String(data.count));
    });
  });

export default count;
