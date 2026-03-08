import { documentUrl, getClient, openOrPrintUrl } from "@repo/backlog-utils";
import { UserError, formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const view = new BeeCommand("view")
  .summary("View a document")
  .description(`Use \`--web\` to open in the browser (\`--project\` is required for \`--web\`).`)
  .argument("<document>", "Document ID")
  .option("-p, --project <id>", "Project ID or project key (required for --web)")
  .addOption(opt.web("document"))
  .addOption(opt.noBrowser())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "View document details", command: "bee document view 12345" },
    {
      description: "Open document in browser",
      command: "bee document view 12345 --web -p PROJECT",
    },
    { description: "Output as JSON", command: "bee document view 12345 --json" },
  ])
  .action(async (document, opts) => {
    const { client, host } = await getClient();

    if (opts.web || opts.browser === false) {
      if (!opts.project) {
        throw new UserError("The --project flag is required when using --web.");
      }
      const url = documentUrl(host, opts.project, document);
      await openOrPrintUrl(url, opts.browser === false, consola);
      return;
    }

    const doc = await client.getDocument(document);

    outputResult(doc, opts, (data) => {
      consola.log("");
      consola.log(`  ${data.title}`);
      consola.log("");
      printDefinitionList([
        ["ID", data.id],
        ["Emoji", data.emoji ?? undefined],
        ["Tags", data.tags.length > 0 ? data.tags.map((t) => t.name).join(", ") : undefined],
        ["Created by", data.createdUser?.name ?? "Unknown"],
        ["Created", formatDate(data.created)],
        ["Updated by", data.updatedUser?.name ?? "Unknown"],
        ["Updated", formatDate(data.updated)],
      ]);

      if (data.plain) {
        consola.log("");
        consola.log("  Body:");
        consola.log(
          data.plain
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n"),
        );
      }

      consola.log("");
    });
  });

export default view;
