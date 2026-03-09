import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const read = new BeeCommand("read")
  .summary("Mark a notification as read")
  .description(
    `Mark a notification as read.

Specify the notification ID to mark as read. Use \`bee notification list\`
to find notification IDs.`,
  )
  .argument("<id>", "Notification ID")
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Mark a notification as read", command: "bee notification read 12345" },
  ])
  .action(async (id, opts) => {
    const { client } = await getClient(opts.space);

    await client.markAsReadNotification(Number(id));

    consola.success(`Marked notification ${id} as read.`);
  });

export default read;
