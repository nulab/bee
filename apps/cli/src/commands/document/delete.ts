import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const deleteDocument = new BeeCommand("delete")
  .summary("Delete a document")
  .description(`This action is irreversible.`)
  .argument("<document>", "Document ID")
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Delete a document (with confirmation)",
      command: "bee document delete 12345",
    },
    {
      description: "Delete a document without confirmation",
      command: "bee document delete 12345 --yes",
    },
  ])
  .action(async (document, opts) => {
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete document ${document}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const doc = await client.deleteDocument(document);

    outputResult(doc, opts, (data) => {
      consola.success(`Deleted document ${data.title} (ID: ${data.id})`);
    });
  });

export default deleteDocument;
