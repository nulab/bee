import { getClient } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const info = new BeeCommand("info")
  .summary("Display space information")
  .description(
    `Display information about the Backlog space.

Shows general details of the space including the space key, name, owner ID,
language, timezone, and creation/update timestamps.`,
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View space information", command: "bee space info" },
    { description: "Output as JSON", command: "bee space info --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const spaceInfo = await client.getSpace();

    outputResult(spaceInfo, opts, (data) => {
      consola.log("");
      consola.log(`  ${data.name}`);
      consola.log("");
      printDefinitionList([
        ["Space Key", data.spaceKey],
        ["Name", data.name],
        ["Owner ID", String(data.ownerId)],
        ["Language", data.lang],
        ["Timezone", data.timezone],
        ["Created", data.created ? formatDate(data.created) : undefined],
        ["Updated", data.updated ? formatDate(data.updated) : undefined],
      ]);
      consola.log("");
    });
  });

export default info;
