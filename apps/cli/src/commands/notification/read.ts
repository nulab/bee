import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";

const read = new BeeCommand("read")
  .summary("Mark a notification as read")
  .description(`Use \`bee notification list\` to find notification IDs.`)
  .argument("<id>", "Notification ID")
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Mark a notification as read", command: "bee notification read 12345" },
  ])
  .action(async (id) => {
    const { client } = await getClient();

    await client.markAsReadNotification(Number(id));

    consola.success(`Marked notification ${id} as read.`);
  });

export default read;
