import { getClient, openOrPrintUrl, wikiUrl } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const view = new BeeCommand("view")
  .summary("View a wiki page")
  .description(`Use \`--web\` to open in the browser.`)
  .argument("<wiki>", "Wiki page ID")
  .addOption(opt.web("wiki page"))
  .addOption(opt.noBrowser())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View a wiki page", command: "bee wiki view 12345" },
    { description: "Open wiki page in browser", command: "bee wiki view 12345 --web" },
    { description: "Output as JSON", command: "bee wiki view 12345 --json" },
  ])
  .action(async (wiki, opts) => {
    const { client, host } = await getClient(opts.space);

    if (opts.web || opts.browser === false) {
      const url = wikiUrl(host, v.parse(vInteger, wiki));
      await openOrPrintUrl(url, opts.browser === false, consola);
      return;
    }

    const wikiData = await client.getWiki(v.parse(vInteger, wiki));

    outputResult(wikiData, opts, (data) => {
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
  });

export default view;
