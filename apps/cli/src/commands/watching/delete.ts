import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult, parseArg, vInteger } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const deleteWatching = new BeeCommand("delete")
  .summary("Delete a watching item")
  .description(
    `Removes the issue from your watching list. You will no longer receive update notifications.`,
  )
  .argument("<watching>", "Watching ID")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Delete a watching item (with confirmation)",
      command: "bee watching delete 12345",
    },
    {
      description: "Delete without confirmation",
      command: "bee watching delete 12345 --yes",
    },
  ])
  .action(async (watching, opts) => {
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete watching ${watching}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const result = await client.deletehWatchingListItem(parseArg(vInteger, watching, "watching"));

    outputResult(result, opts, (data) => {
      consola.success(`Deleted watching ${data.id}.`);
    });
  });

export default deleteWatching;
