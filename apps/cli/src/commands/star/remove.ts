import { getClient } from "@repo/backlog-utils";
import { vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const remove = new BeeCommand("remove")
  .summary("Remove a star")
  .description(`Use \`bee star list\` to find star IDs.`)
  .argument("<star>", "Star ID")
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([{ description: "Remove a star", command: "bee star remove 12345" }])
  .action(async (star, opts) => {
    const { client } = await getClient(opts.space);
    await client.removeStar(v.parse(vInteger, star));
    consola.success(`Removed star ${star}.`);
  });

export default remove;
