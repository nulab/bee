import { getClient, openUrl, wikiUrl } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog wiki page.

Shows the page name, ID, tags, created/updated info, and the full body
content.

Use \`--web\` to open the wiki page in your default browser instead.`,

  examples: [
    { description: "View a wiki page", command: "bee wiki view 12345" },
    { description: "Open wiki page in browser", command: "bee wiki view 12345 --web" },
    { description: "Output as JSON", command: "bee wiki view 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a wiki page",
    },
    args: {
      ...outputArgs,
      wiki: {
        type: "positional",
        description: "Wiki page ID",
        valueHint: "<number>",
        required: true,
      },
      web: commonArgs.web("wiki page"),
    },
    async run({ args }) {
      const { client, host } = await getClient();

      if (args.web) {
        const url = wikiUrl(host, Number(args.wiki));
        await openUrl(url);
        consola.info(`Opening ${url} in your browser.`);
        return;
      }

      const wiki = await client.getWiki(Number(args.wiki));

      outputResult(wiki, args, (data) => {
        consola.log("");
        consola.log(`  ${data.name}`);
        consola.log("");
        printDefinitionList([
          ["ID", String(data.id)],
          [
            "Tags",
            data.tags.length > 0
              ? data.tags.map((t: { name: string }) => t.name).join(", ")
              : undefined,
          ],
          ["Created by", data.createdUser?.name],
          ["Created", formatDate(data.created)],
          ["Updated by", data.updatedUser?.name],
          ["Updated", formatDate(data.updated)],
        ]);
        if (data.content) {
          consola.log("");
          consola.log(`  ${data.content}`);
        }
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
