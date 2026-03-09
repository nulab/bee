import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const attachments = new BeeCommand("attachments")
  .summary("List wiki page attachments")
  .description(
    `List files attached to a Backlog wiki page.

Shows file name, size, creator, and creation date.`,
  )
  .argument("<wiki>", "Wiki page ID")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List wiki attachments", command: "bee wiki attachments 12345" },
    { description: "Output as JSON", command: "bee wiki attachments 12345 --json" },
  ])
  .action(async (wiki, opts) => {
    const { client } = await getClient(opts.space);

    const files = await client.getWikisAttachments(Number(wiki));

    outputResult(files, opts, (data) => {
      if (data.length === 0) {
        consola.info("No attachments found.");
        return;
      }

      const rows: Row[] = data.map(
        (f: { name: string; size: number; createdUser: { name: string }; created: string }) => [
          { header: "NAME", value: f.name },
          { header: "SIZE", value: String(f.size) },
          { header: "CREATED BY", value: f.createdUser.name },
          { header: "CREATED", value: formatDate(f.created) },
        ],
      );

      printTable(rows);
    });
  });

export default attachments;
