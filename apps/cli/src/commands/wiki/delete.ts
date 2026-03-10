import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult, parseArg, vInteger } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const deleteWiki = new BeeCommand("delete")
  .summary("Delete a wiki page")
  .description(`This action is irreversible.`)
  .argument("<wiki>", "Wiki page ID")
  .option("-y, --yes", "Skip confirmation prompt")
  .option("--mail-notify", "Send notification email")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Delete a wiki page (with confirmation)",
      command: "bee wiki delete 12345",
    },
    {
      description: "Delete a wiki page without confirmation",
      command: "bee wiki delete 12345 --yes",
    },
  ])
  .action(async (wiki, opts) => {
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete wiki page ${wiki}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const wikiData = await client.deleteWiki(
      parseArg(vInteger, wiki, "wiki"),
      opts.mailNotify ?? false,
    );

    outputResult(wikiData, opts, (data) => {
      consola.success(`Deleted wiki page ${data.id}: ${data.name}`);
    });
  });

export default deleteWiki;
