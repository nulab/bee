import { documentUrl, getClient, resolveProjectIds } from "@repo/backlog-utils";
import { outputResult, promptRequired, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const create = new BeeCommand("create")
  .summary("Create a document")
  .description(
    `Omitted required fields will be prompted interactively. When input is piped, it is used as the body automatically.`,
  )
  .option("-p, --project <id>", "Project ID or project key")
  .option("-t, --title <text>", "Document title")
  .option("-b, --body <text>", "Document body content")
  .option("--emoji <emoji>", "Emoji for the document")
  .option("--parent-id <id>", "Parent document ID for creating as a child document")
  .option("--add-last", "Add document to the end of the list")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Create a document with title and body",
      command: 'bee document create -p PROJECT -t "Meeting Notes" -b "Content here"',
    },
    {
      description: "Create a document from stdin",
      command: 'echo "Content" | bee document create -p PROJECT -t "Notes"',
    },
    {
      description: "Create a child document",
      command: 'bee document create -p PROJECT -t "Sub Page" --parent-id 12345',
    },
    {
      description: "Output as JSON",
      command: 'bee document create -p PROJECT -t "Title" --json',
    },
  ])
  .action(async (opts) => {
    const { client, host } = await getClient(opts.space);

    const project = await promptRequired("Project:", opts.project);
    const title = await promptRequired("Title:", opts.title);

    const [projectId] = await resolveProjectIds(client, [project]);

    const body = await resolveStdinArg(opts.body);

    const doc = await client.addDocument({
      projectId,
      title,
      content: body,
      emoji: opts.emoji,
      parentId: opts.parentId,
      addLast: opts.addLast,
    });

    outputResult(doc, opts, (data) => {
      consola.success(`Created document ${data.title} (ID: ${data.id})`);
      consola.info(documentUrl(host, project, data.id));
    });
  });

export default create;
