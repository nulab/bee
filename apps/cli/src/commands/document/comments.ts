import { type DocumentCommentEntry, getClient, getDocumentComments } from "@repo/backlog-utils";
import { formatDate, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const printEntry = (entry: DocumentCommentEntry, indent: string) => {
  consola.log(`${indent}${entry.createdUser?.name ?? "Unknown"} (${formatDate(entry.created)}):`);
  consola.log(
    entry.plain
      .split("\n")
      .map((line) => `${indent}  ${line}`)
      .join("\n"),
  );
};

const comments = new BeeCommand("comments")
  .summary("List comments on a document")
  .description(`Displays each comment followed by its replies.`)
  .argument("<document>", "Document ID")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List document comments", command: "bee document comments 12345" },
    { description: "Output as JSON", command: "bee document comments 12345 --json" },
  ])
  .action(async (document: string, opts) => {
    const { client } = await getClient(opts.space);

    const threads = await getDocumentComments(client, document);

    outputResult(threads, opts, (data) => {
      if (data.length === 0) {
        consola.info("No comments found.");
        return;
      }

      consola.log("");
      for (const thread of data) {
        printEntry(thread, "  ");
        for (const reply of thread.replies) {
          printEntry(reply, "    ");
        }
        consola.log("");
      }
    });
  });

export default comments;
