import { getClient, resolveProjectIds } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  outputResult,
  printTable,
  splitArg,
  vInteger,
} from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List documents")
  .description(`Use \`--keyword\` to search within document titles and content.`)
  .addOption(opt.project())
  .addOption(opt.keyword())
  .option("--sort <field>", "Sort field {created|updated}")
  .addOption(opt.order())
  .addOption(opt.count())
  .addOption(opt.offset())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List documents in a project", command: "bee document list -p PROJECT" },
    {
      description: "Search documents by keyword",
      command: 'bee document list -p PROJECT -k "meeting notes"',
    },
    { description: "Output as JSON", command: "bee document list -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const projectId = await resolveProjectIds(client, splitArg(opts.project, v.string()));

    const documents = await client.getDocuments({
      projectId,
      keyword: opts.keyword,
      sort: opts.sort,
      order: opts.order,
      count: v.parse(v.optional(vInteger), opts.count),
      offset: v.parse(v.optional(vInteger), opts.offset) ?? 0,
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(documents, { json }, (data) => {
      if (data.length === 0) {
        consola.info("No documents found.");
        return;
      }

      const rows: Row[] = data.map((doc) => [
        { header: "ID", value: doc.id },
        { header: "EMOJI", value: doc.emoji ?? "" },
        { header: "TITLE", value: doc.title },
        { header: "UPDATED", value: formatDate(doc.updated) },
      ]);

      printTable(rows);
    });
  });

export default list;
