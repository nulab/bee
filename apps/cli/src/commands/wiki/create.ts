import { getClient, resolveProjectIds } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired, resolveStdinArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog wiki page.

Requires a project, page name, and body content. When input is piped,
it is used as the body automatically.`,

  examples: [
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
        description: "Wiki page content",
      },
      "mail-notify": {
        type: "boolean",
        description: "Send notification email",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const project = await promptRequired("Project:", args.project);
      const name = await promptRequired("Page name:", args.name);
      const body = (await resolveStdinArg(args.body)) ?? "";

      const [projectId] = await resolveProjectIds(client, [project]);

      const wiki = await client.postWiki({
        projectId,
        name,
        content: body,
        mailNotify: args["mail-notify"],
      });

      outputResult(wiki, args, (data) => {
        consola.success(`Created wiki page ${data.id}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
