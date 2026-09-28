import { getClient, removeDocumentTags } from "@repo/backlog-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const removeTag = new BeeCommand("remove-tag")
  .summary("Remove tags from a document")
  .description(`Tags the document does not have are ignored.`)
  .argument("<document>", "Document ID")
  .argument("<tags...>", "Tag names")
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Remove a tag", command: "bee document remove-tag 12345 draft" },
    { description: "Remove several tags", command: "bee document remove-tag 12345 draft wip" },
  ])
  .action(async (document: string, tags: string[], opts) => {
    const { client } = await getClient(opts.space);

    await removeDocumentTags(client, document, tags);

    consola.success(
      `Removed ${tags.length === 1 ? "tag" : "tags"} ${tags.join(", ")} from document ${document}`,
    );
  });

export default removeTag;
