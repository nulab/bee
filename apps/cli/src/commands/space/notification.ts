import { getClient } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const notification = new BeeCommand("notification")
  .summary("Display the space notification")
  .description(
    `Display the space notification.

Shows the notification message that is set for the entire Backlog space,
along with the date it was last updated.`,
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View space notification", command: "bee space notification" },
    { description: "Output as JSON", command: "bee space notification --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const data = await client.getSpaceNotification();

    outputResult(data, opts, (result) => {
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
  });

export default notification;
