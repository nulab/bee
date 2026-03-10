import { getClient } from "@repo/backlog-utils";
import { parseArg, vInteger } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const read = new BeeCommand("read")
  .summary("Mark a watching item as read")
  .description(`Use \`bee watching list\` to find watching IDs.`)
  .argument("<watching>", "Watching ID")
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([{ description: "Mark a watching item as read", command: "bee watching read 12345" }])
  .action(async (watching, opts) => {
    const { client } = await getClient(opts.space);

    await client.resetWatchingListItemAsRead(parseArg(vInteger, watching, "watching"));

    consola.success(`Marked watching ${watching} as read.`);
  });

export default read;
