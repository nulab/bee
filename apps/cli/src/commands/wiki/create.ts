import { getClient, resolveProjectIds, wikiUrl } from "@repo/backlog-utils";
import { outputResult, promptRequired, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const create = new BeeCommand("create")
  .summary("Create a wiki page")
  .description(
    `Create a new Backlog wiki page.

Requires a project, page name, and body content. When input is piped,
it is used as the body automatically.`,
  )
  .option("-p, --project <id>", "Project ID or project key")
  .option("-n, --name <name>", "Wiki page name")
  .option("-b, --body <text>", "Wiki page content")
  .option("--mail-notify", "Send notification email")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Create a wiki page",
      command: 'bee wiki create -p PROJECT -n "Page Name" -b "Content"',
    },
    {
      description: "Create a wiki page from stdin",
      command: 'echo "Body" | bee wiki create -p PROJECT -n "Name"',
    },
    {
      description: "Create and send notification email",
      command: 'bee wiki create -p PROJECT -n "Name" -b "Content" --mail-notify',
    },
  ])
  .action(async (opts) => {
    const { client, host } = await getClient(opts.space);

    const project = await promptRequired("Project:", opts.project);
    const name = await promptRequired("Page name:", opts.name);
    const body = (await resolveStdinArg(opts.body)) ?? "";

    const [projectId] = await resolveProjectIds(client, [project]);

    const wiki = await client.postWiki({
      projectId,
      name,
      content: body,
      mailNotify: opts.mailNotify,
    });

    outputResult(wiki, opts, (data) => {
      consola.success(`Created wiki page ${data.id}: ${data.name}`);
      consola.info(wikiUrl(host, data.id));
    });
  });

export default create;
