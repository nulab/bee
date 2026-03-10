import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  confirmOrExit,
  formatDate,
  outputResult,
  printTable,
  resolveStdinArg,
} from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const comment = new BeeCommand("comment")
  .summary("Add a comment to an issue")
  .description(
    `When input is piped, it is used as the body automatically.

Use \`--list\`, \`--edit-last\`, or \`--delete-last\` for other comment operations.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .option("-b, --body <text>", "Comment body")
  .addOption(opt.notify())
  .addOption(opt.attachment())
  .option("--list", "List comments on the issue")
  .option("--edit-last", "Edit your most recent comment")
  .option("--delete-last", "Delete your most recent comment")
  .option("--yes", "Skip confirmation prompt for delete")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Add a comment",
      command: 'bee issue comment PROJECT-123 -b "This is a comment"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee issue comment PROJECT-123',
    },
    { description: "List all comments", command: "bee issue comment PROJECT-123 --list" },
    {
      description: "Edit your last comment",
      command: 'bee issue comment PROJECT-123 --edit-last -b "Updated text"',
    },
    {
      description: "Delete your last comment",
      command: "bee issue comment PROJECT-123 --delete-last --yes",
    },
  ])
  .action(async (issue, opts) => {
    const { client } = await getClient(opts.space);

    if (opts.list) {
      const comments = await client.getIssueComments(issue, { order: "asc" });

      outputResult(comments, opts as { json?: string }, (data) => {
        const filtered = data.filter((c) => c.content);
        if (filtered.length === 0) {
          consola.info("No comments found.");
          return;
        }

        const rows: Row[] = filtered.map((c) => [
          { header: "ID", value: String(c.id) },
          { header: "AUTHOR", value: c.createdUser.name },
          { header: "DATE", value: formatDate(c.created) },
          { header: "CONTENT", value: c.content! },
        ]);

        printTable(rows);
      });
      return;
    }

    if (opts.editLast) {
      const myself = await client.getMyself();
      const comments = await client.getIssueComments(issue, { order: "desc" });
      const myComment = comments.find((c) => c.createdUser.id === myself.id);

      if (!myComment) {
        consola.error(`No comment by you was found on ${issue}.`);
        return;
      }

      const content = (await resolveStdinArg(opts.body)) ?? opts.body;
      if (!content) {
        consola.error("Comment body is required. Use --body or pipe input.");
        return;
      }

      const result = await client.patchIssueComment(issue, myComment.id, { content });

      outputResult(result, opts as { json?: string }, () => {
        consola.success(`Updated comment on ${issue}`);
      });
      return;
    }

    if (opts.deleteLast) {
      const myself = await client.getMyself();
      const comments = await client.getIssueComments(issue, { order: "desc" });
      const myComment = comments.find((c) => c.createdUser.id === myself.id);

      if (!myComment) {
        consola.error(`No comment by you was found on ${issue}.`);
        return;
      }

      const confirmed = await confirmOrExit(
        `Are you sure you want to delete your comment on ${issue}?`,
        opts.yes,
      );
      if (!confirmed) {
        return;
      }

      const result = await client.deleteIssueComment(issue, myComment.id);

      outputResult(result, opts as { json?: string }, () => {
        consola.success(`Deleted comment on ${issue}`);
      });
      return;
    }

    // Default: add comment
    const content = (await resolveStdinArg(opts.body)) ?? opts.body;
    if (!content) {
      consola.error("Comment body is required. Use --body or pipe input.");
      return;
    }
    const notifiedUserId = opts.notify ?? [];
    const attachmentId = opts.attachment ?? [];

    const result = await client.postIssueComments(issue, {
      content,
      notifiedUserId,
      attachmentId,
    });

    outputResult(result, opts as { json?: string }, () => {
      consola.success(`Added comment to ${issue}`);
    });
  });

export default comment;
