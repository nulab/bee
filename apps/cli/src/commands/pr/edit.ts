import { getClient, resolveUserId } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit a pull request")
  .description(`Only specified fields are updated; others remain unchanged.`)
  .argument("<number>", "Pull request number")
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("-t, --title <text>", "New title of the pull request")
  .option("-b, --body <text>", "New description of the pull request")
  .option("--assignee <id>", "New assignee user ID. Use @me for yourself.")
  .option("--issue <key>", "New related issue ID or issue key")
  .addOption(opt.comment())
  .addOption(opt.notify())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    {
      description: "Update pull request title",
      command: 'bee pr edit 42 -p PROJECT -R repo -t "New title"',
    },
    {
      description: "Change assignee",
      command: "bee pr edit 42 -p PROJECT -R repo --assignee 12345",
    },
    {
      description: "Add a comment with the update",
      command: 'bee pr edit 42 -p PROJECT -R repo -t "New title" --comment "Updated title"',
    },
  ])
  .action(async (number, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const prNumber = Number(number);
    const notifiedUserId = opts.notify ?? [];

    let issueId: number | undefined;
    if (opts.issue) {
      if (Number.isNaN(Number(opts.issue))) {
        const issue = await client.getIssue(opts.issue);
        issueId = issue.id;
      } else {
        issueId = Number(opts.issue);
      }
    }

    const pullRequest = await client.patchPullRequest(opts.project, opts.repo, prNumber, {
      summary: opts.title,
      description: opts.body,
      issueId,
      assigneeId: opts.assignee ? await resolveUserId(client, opts.assignee) : undefined,
      comment: opts.comment ?? undefined,
      notifiedUserId,
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(pullRequest, { json }, (data) => {
      consola.success(`Updated pull request #${data.number}: ${data.summary}`);
    });
  });

export default edit;
