import { getClient } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const view = new BeeCommand("view")
  .summary("View a watching item")
  .description(
    `Display details of a watching item.

Shows the watching ID, associated issue, note, read status, and timestamps.`,
  )
  .argument("<watching>", "Watching ID")
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View a watching item", command: "bee watching view 12345" },
    { description: "Output as JSON", command: "bee watching view 12345 --json" },
  ])
  .action(async (watching, opts) => {
    const { client } = await getClient();

    const watchingData = await client.getWatchingListItem(Number(watching));

    outputResult(watchingData, opts, (data) => {
      consola.log("");
      consola.log(`  ${data.issue.issueKey}: ${data.issue.summary}`);
      consola.log("");
      printDefinitionList([
        ["ID", String(data.id)],
        ["Issue Key", data.issue.issueKey],
        ["Title", data.issue.summary],
        ["Note", data.note || undefined],
        ["Read", data.resourceAlreadyRead ? "Read" : "Unread"],
        ["Created", formatDate(data.created)],
        ["Updated", formatDate(data.updated)],
      ]);
      consola.log("");
    });
  });

export default view;
