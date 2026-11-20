import { getClient, getDocumentsCount } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const count = new BeeCommand("count")
  .summary("Count documents")
  .addOption(opt.project())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Count documents", command: "bee document count -p PROJECT" },
    { description: "Output as JSON", command: "bee document count -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const result = await getDocumentsCount(client, opts.project);

    outputResult(result, opts, (data) => {
      consola.log(String(data.count));
    });
  });

export default count;
