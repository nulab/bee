import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const add = new BeeCommand("add")
  .summary("Add a watching item")
  .description(
    `Add an issue to your watching list.

Subscribe to an issue to receive notifications when it is updated. Optionally
attach a note for your own reference.`,
  )
  .requiredOption("--issue <key>", "Issue ID or issue key")
  .option("--note <text>", "Note to attach to the watching item")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Watch an issue", command: "bee watching add --issue PROJECT-123" },
    {
      description: "Watch an issue with a note",
      command: 'bee watching add --issue PROJECT-123 --note "Track progress"',
    },
  ])
  .action(async (opts) => {
    const { client } = await getClient(opts.space);

    const result = await client.postWatchingListItem({
      issueIdOrKey: opts.issue,
      note: opts.note ?? "",
    });

    outputResult(result, opts, (data) => {
      consola.success(`Added watching for issue ${data.issue.issueKey} (ID: ${data.id}).`);
    });
  });

export default add;
