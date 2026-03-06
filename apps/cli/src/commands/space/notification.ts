import { getClient } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display the space notification.

Shows the notification message that is set for the entire Backlog space,
along with the date it was last updated.`,

  examples: [
    { description: "View space notification", command: "bee space notification" },
    { description: "Output as JSON", command: "bee space notification --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const notification = withUsage(
  defineCommand({
    meta: {
      name: "notification",
      description: "Display the space notification",
    },
    args: {
      ...outputArgs,
    },
    async run({ args }) {
      const { client } = await getClient();

      const data = await client.getSpaceNotification();

      outputResult(data, args, (result) => {
        if (!result.content) {
          consola.info("No space notification set.");
          return;
        }

        consola.log("");
        printDefinitionList([
          ["Content", result.content],
          ["Updated", result.updated ? formatDate(result.updated) : undefined],
        ]);
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, notification };
