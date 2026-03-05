import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, readStdin } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Update an existing Backlog wiki page.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged. Use \`--body -\` to read body content from stdin.`,

  examples: [
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
      command: 'echo "New content" | bee wiki edit 12345 -b -',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit a wiki page",
    },
    args: {
      ...outputArgs,
      wiki: {
        type: "positional",
        description: "Wiki page ID",
        valueHint: "<number>",
        required: true,
      },
      name: {
        type: "string",
        alias: "n",
        description: "New name of the wiki page",
      },
      body: {
        type: "string",
        alias: "b",
        description: "New content of the wiki page. Use - to read from stdin.",
      },
      notify: {
        type: "boolean",
        description: "Send notification email",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const content = args.body === "-" ? await readStdin() : args.body;

      const wiki = await client.patchWiki(Number(args.wiki), {
        name: args.name,
        content,
        mailNotify: args.notify,
      });

      outputResult(wiki, args, (data) => {
        consola.success(`Updated wiki page ${data.id}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
