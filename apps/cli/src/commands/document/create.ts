import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired, readStdin } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import { resolveProjectIds } from "../../lib/resolve-project";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog document.

Requires a project and title. When run interactively, omitted required
fields will be prompted.

Use \`--body -\` to read content from standard input.`,

  examples: [
    {
      description: "Create a document with title and body",
      command: 'bee document create -p PROJECT -t "Meeting Notes" -b "Content here"',
    },
    {
      description: "Create a document from stdin",
      command: 'echo "Content" | bee document create -p PROJECT -t "Notes" --body -',
    },
    {
      description: "Create a child document",
      command: 'bee document create -p PROJECT -t "Sub Page" --parent-id 12345',
    },
    {
      description: "Output as JSON",
      command: 'bee document create -p PROJECT -t "Title" --json',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create a document",
    },
    args: {
      ...outputArgs,
      project: {
        type: "string",
        alias: "p",
        description: "Project ID or project key",
        default: process.env.BACKLOG_PROJECT,
      },
      title: {
        type: "string",
        alias: "t",
        description: "Document title",
      },
      body: {
        type: "string",
        alias: "b",
        description: "Document body content",
      },
      emoji: {
        type: "string",
        description: "Emoji for the document",
      },
      "parent-id": {
        type: "string",
        description: "Parent document ID for creating as a child document",
      },
      "add-last": {
        type: "boolean",
        description: "Add document to the end of the list",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const project = await promptRequired("Project:", args.project);
      const title = await promptRequired("Title:", args.title);

      const [projectId] = await resolveProjectIds(client, [project]);

      const body = args.body === "-" ? await readStdin() : args.body;

      const doc = await client.addDocument({
        projectId,
        title,
        content: body,
        emoji: args.emoji,
        parentId: args["parent-id"],
        addLast: args["add-last"],
      });

      outputResult(doc, args, (data) => {
        consola.success(`Created document: ${data.title}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
