import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";

const remove = new BeeCommand("remove")
  .summary("Remove a star")
  .description(`Use \`bee star list\` to find star IDs.`)
  .argument("<star>", "Star ID")
  .envVars([...ENV_AUTH])
  .examples([{ description: "Remove a star", command: "bee star remove 12345" }])
  .action(async (star) => {
    const { client } = await getClient();
    await client.removeStar(Number(star));
    consola.success(`Removed star ${star}.`);
  });

export default remove;
