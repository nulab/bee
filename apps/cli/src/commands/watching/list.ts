import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List watching items")
  .description(
    `List watching items for the authenticated user.

Watching items are issue subscriptions. Unread items are marked with an
asterisk (\`*\`).`,
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List your watching items", command: "bee watching list" },
    { description: "Output as JSON", command: "bee watching list --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const myself = await client.getMyself();
    const watchings = await client.getWatchingListItems(myself.id);

    outputResult(watchings, opts, (data) => {
      if (data.length === 0) {
        consola.info("No watching items found.");
        return;
      }

      const rows: Row[] = data.map((w) => [
        { header: "", value: w.resourceAlreadyRead ? " " : "*" },
        { header: "ID", value: String(w.id) },
        { header: "ISSUE KEY", value: w.issue.issueKey },
        { header: "TITLE", value: w.issue.summary },
      ]);

      printTable(rows);
    });
  });

export default list;
