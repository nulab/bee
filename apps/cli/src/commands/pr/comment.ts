import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const comment = new BeeCommand("comment")
  .summary("Add a comment to a pull request")
  .description(
    `Add a comment to a Backlog pull request.

The comment body is required when adding a comment. When input is piped,
it is used as the body automatically.

Use \`--list\` to list all comments on a pull request.
Use \`--edit-last\` to edit your most recent comment.`,
  )
  .argument("<number>", "Pull request number")
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("-b, --body <text>", "Comment body")
  .addOption(opt.notify())
  .option("--list", "List comments on the pull request")
  .option("--edit-last", "Edit your most recent comment")
  .addOption(opt.json())
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
  .action(async (number, _opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client } = await getClient();
    const prNumber = Number(number);

    const json = opts.json === true ? "" : (opts.json as string | undefined);

    if (opts.list) {
      const comments = await client.getPullRequestComments(
        opts.project as string,
        opts.repo as string,
        prNumber,
        {
          order: "asc",
        },
      );

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
      const comments = await client.getPullRequestComments(
        opts.project as string,
        opts.repo as string,
        prNumber,
        {
          order: "desc",
        },
      );
      const myComment = comments.find((c) => c.createdUser.id === myself.id);

      if (!myComment) {
        consola.error(`No comment by you was found on pull request #${number}.`);
        return;
      }

      const content = (await resolveStdinArg(opts.body as string | undefined)) ?? opts.body;
      if (!content) {
        consola.error("Comment body is required. Use --body or pipe input.");
        return;
      }

      const result = await client.patchPullRequestComments(
        opts.project as string,
        opts.repo as string,
        prNumber,
        myComment.id,
        { content: content as string },
      );

      outputResult(result, { json }, () => {
        consola.success(`Updated comment on pull request #${number}`);
      });
      return;
    }

    // Default: add comment
    const content = (await resolveStdinArg(opts.body as string | undefined)) ?? opts.body;
    if (!content) {
      consola.error("Comment body is required. Use --body or pipe input.");
      return;
    }
    const notifiedUserId = (opts.notify as number[]) ?? [];

    const result = await client.postPullRequestComments(
      opts.project as string,
      opts.repo as string,
      prNumber,
      {
        content: content as string,
        notifiedUserId,
      },
    );

    outputResult(result, { json }, () => {
      consola.success(`Added comment to pull request #${number}`);
    });
  });

export default comment;
