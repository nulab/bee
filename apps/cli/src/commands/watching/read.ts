import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";

const read = new BeeCommand("read")
  .summary("Mark a watching item as read")
  .description(`Use \`bee watching list\` to find watching IDs.`)
  .argument("<watching>", "Watching ID")
  .envVars([...ENV_AUTH])
  .examples([{ description: "Mark a watching item as read", command: "bee watching read 12345" }])
  .action(async (watching) => {
    const { client } = await getClient();

    await client.resetWatchingListItemAsRead(Number(watching));

    consola.success(`Marked watching ${watching} as read.`);
  });

export default read;
