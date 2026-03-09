import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, formatSize, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const attachments = new BeeCommand("attachments")
  .summary("List issue attachments")
  .description(
    `List attachments of a Backlog issue.

Shows file name, size, creator, and creation date.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List attachments", command: "bee issue attachments PROJECT-123" },
    { description: "Output as JSON", command: "bee issue attachments PROJECT-123 --json" },
  ])
  .action(async (issue, opts) => {
    const { client } = await getClient(opts.space);

    const files = await client.getIssueAttachments(issue);

    outputResult(files, opts as { json?: string }, (data) => {
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
