import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const count = new BeeCommand("count")
  .summary("Count wiki pages")
  .description(
    `Display the number of wiki pages in a Backlog project.

The count includes all wiki pages regardless of tag or keyword.`,
  )
  .addOption(opt.project())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Count wiki pages", command: "bee wiki count -p PROJECT" },
    { description: "Output as JSON", command: "bee wiki count -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const result = await client.getWikisCount(opts.project);

    const json = opts.json === true ? "" : opts.json;
    outputResult(result, { json }, (data) => {
      consola.log(String(data.count));
    });
  });

export default count;
