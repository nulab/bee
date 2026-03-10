import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  outputResult,
  printTable,
  resolveStdinArg,
  vInteger,
} from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const comment = new BeeCommand("comment")
  .summary("Add a comment to a pull request")
  .description(
    `When input is piped, it is used as the body automatically.

Use \`--list\` or \`--edit-last\` for other comment operations.`,
  )
  .argument("<number>", "Pull request number")
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("-b, --body <text>", "Comment body")
  .addOption(opt.notify())
  .option("--list", "List comments on the pull request")
  .option("--edit-last", "Edit your most recent comment")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    {
      description: "Add a comment",
      command: 'bee pr comment 42 -p PROJECT -R repo -b "Looks good!"',
    },
    {
      description: "Add a comment from stdin",
      command: 'echo "Comment body" | bee pr comment 42 -p PROJECT -R repo',
    },
    { description: "List all comments", command: "bee pr comment 42 -p PROJECT -R repo --list" },
    {
      description: "Edit your last comment",
      command: 'bee pr comment 42 -p PROJECT -R repo --edit-last -b "Updated"',
    },
  ])
  .action(async (number, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);
    const prNumber = v.parse(vInteger, number);

    const json = opts.json === true ? "" : opts.json;

    if (opts.list) {
      const comments = await client.getPullRequestComments(opts.project, opts.repo, prNumber, {
        order: "asc",
      });

      outputResult(comments, { json }, (data) => {
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
      const comments = await client.getPullRequestComments(opts.project, opts.repo, prNumber, {
        order: "desc",
      });
      const myComment = comments.find((c) => c.createdUser.id === myself.id);

      if (!myComment) {
        consola.error(`No comment by you was found on pull request #${number}.`);
        return;
      }

      const content = (await resolveStdinArg(opts.body)) ?? opts.body;
      if (!content) {
        consola.error("Comment body is required. Use --body or pipe input.");
        return;
      }

      const result = await client.patchPullRequestComments(
        opts.project,
        opts.repo,
        prNumber,
        myComment.id,
        { content },
      );

      outputResult(result, { json }, () => {
        consola.success(`Updated comment on pull request #${number}`);
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

    const result = await client.postPullRequestComments(opts.project, opts.repo, prNumber, {
      content,
      notifiedUserId,
    });

    outputResult(result, { json }, () => {
      consola.success(`Added comment to pull request #${number}`);
    });
  });

export default comment;
