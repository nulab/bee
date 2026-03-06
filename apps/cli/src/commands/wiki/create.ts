import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired, readStdin } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";
import { resolveProjectIds } from "../../lib/resolve-project";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog wiki page.

Requires a project, page name, and body content. Use \`--body -\` to read
body content from stdin.`,

  examples: [
    {
      description: "Create a wiki page",
      command: 'bee wiki create -p PROJECT -n "Page Name" -b "Content"',
    },
    {
      description: "Create a wiki page from stdin",
      command: 'echo "Body" | bee wiki create -p PROJECT -n "Name" -b -',
    },
    {
      description: "Create and notify",
      command: 'bee wiki create -p PROJECT -n "Name" -b "Content" --notify',
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
      description: "Create a wiki page",
    },
    args: {
      ...outputArgs,
      project: commonArgs.project,
      name: {
        type: "string",
        alias: "n",
        description: "Wiki page name",
      },
      body: {
        type: "string",
        alias: "b",
        description: "Wiki page content. Use - to read from stdin.",
      },
      notify: {
        type: "boolean",
        description: "Send notification email",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const project = await promptRequired("Project:", args.project);
      const name = await promptRequired("Page name:", args.name);
      const body = args.body === "-" ? await readStdin() : (args.body ?? "");

      const [projectId] = await resolveProjectIds(client, [project]);

      const wiki = await client.postWiki({
        projectId,
        name,
        content: body,
        mailNotify: args.notify,
      });

      outputResult(wiki, args, (data) => {
        consola.success(`Created wiki page ${data.id}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
