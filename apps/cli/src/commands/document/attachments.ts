import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, formatSize, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const attachments = new BeeCommand("attachments")
  .summary("List document attachments")
  .description(`Shows file name, size, creator, and creation date.`)
  .argument("<document>", "Document ID")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List attachments", command: "bee document attachments 12345" },
    { description: "Output as JSON", command: "bee document attachments 12345 --json" },
  ])
  .action(async (document, opts) => {
    const { client } = await getClient(opts.space);

    const doc = await client.getDocument(document);

    outputResult(doc.attachments, opts, (data) => {
      if (data.length === 0) {
        consola.info("No attachments found.");
        return;
      }

      const rows: Row[] = data.map((file) => [
        { header: "ID", value: String(file.id) },
        { header: "NAME", value: file.name },
        { header: "SIZE", value: formatSize(file.size) },
        { header: "CREATED BY", value: file.createdUser?.name ?? "Unknown" },
        { header: "CREATED", value: formatDate(file.created) },
      ]);

      printTable(rows);
    });
  });

export default attachments;
