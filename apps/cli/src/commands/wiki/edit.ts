import { getClient } from "@repo/backlog-utils";
import { outputResult, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const edit = new BeeCommand("edit")
  .summary("Edit a wiki page")
  .description(
    `Update an existing Backlog wiki page.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged. When input is piped, it is used as the body
automatically.`,
  )
  .argument("<wiki>", "Wiki page ID")
  .option("-n, --name <name>", "New name of the wiki page")
  .option("-b, --body <text>", "New content of the wiki page")
  .option("--mail-notify", "Send notification email")
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Update wiki page name",
      command: 'bee wiki edit 12345 -n "New Name"',
    },
    {
      description: "Update wiki page body",
      command: 'bee wiki edit 12345 -b "New content"',
    },
    {
      description: "Update body from stdin",
      command: 'echo "New content" | bee wiki edit 12345',
    },
  ])
  .action(async (wiki, opts) => {
    const { client } = await getClient();

    const content = await resolveStdinArg(opts.body);

    const wikiData = await client.patchWiki(Number(wiki), {
      name: opts.name,
      content,
      mailNotify: opts.mailNotify,
    });

    outputResult(wikiData, opts, (data) => {
      consola.success(`Updated wiki page ${data.id}: ${data.name}`);
    });
  });

export default edit;
