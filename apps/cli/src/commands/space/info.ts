import { getClient } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display information about the Backlog space.

Shows general details of the space including the space key, name, owner ID,
language, timezone, and creation/update timestamps.`,

  examples: [
    { description: "View space information", command: "bee space info" },
    { description: "Output as JSON", command: "bee space info --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const info = withUsage(
  defineCommand({
    meta: {
      name: "info",
      description: "Display space information",
    },
    args: {
      ...outputArgs,
    },
    async run({ args }) {
      const { client } = await getClient();

      const spaceInfo = await client.getSpace();

      outputResult(spaceInfo, args, (data) => {
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
    },
  }),
  commandUsage,
);

export { commandUsage, info };
