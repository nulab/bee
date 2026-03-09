import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const readAll = new BeeCommand("read-all")
  .summary("Mark all notifications as read")
  .description(`Resets the unread notification count to zero.`)
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Mark all notifications as read", command: "bee notification read-all" },
  ])
  .action(async (opts) => {
    const { client } = await getClient(opts.space);

    await client.resetNotificationsMarkAsRead();

    consola.success("Marked all notifications as read.");
  });

export default readAll;
