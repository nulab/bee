import { getClient } from "@repo/backlog-utils";
import { vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const read = new BeeCommand("read")
  .summary("Mark a notification as read")
  .description(`Use \`bee notification list\` to find notification IDs.`)
  .argument("<id>", "Notification ID")
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Mark a notification as read", command: "bee notification read 12345" },
  ])
  .action(async (id, opts) => {
    const { client } = await getClient(opts.space);

    await client.markAsReadNotification(v.parse(vInteger, id));

    consola.success(`Marked notification ${id} as read.`);
  });

export default read;
