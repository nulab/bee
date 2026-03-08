import { getClient, resolveUserId } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit a pull request")
  .description(
    `Update an existing Backlog pull request.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,
  )
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
  .action(async (number, _opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client } = await getClient();

    const prNumber = Number(number);
    const notifiedUserId = (opts.notify as number[]) ?? [];

    let issueId: number | undefined;
    if (opts.issue) {
      if (Number.isNaN(Number(opts.issue))) {
        const issue = await client.getIssue(opts.issue as string);
        issueId = issue.id;
      } else {
        issueId = Number(opts.issue);
      }
    }

    const pullRequest = await client.patchPullRequest(
      opts.project as string,
      opts.repo as string,
      prNumber,
      {
        summary: opts.title as string | undefined,
        description: opts.body as string | undefined,
        issueId,
        assigneeId: opts.assignee
          ? await resolveUserId(client, opts.assignee as string)
          : undefined,
        // @ts-expect-error backlog-js types say string[] but Backlog API accepts a single string
        comment: opts.comment ?? undefined,
        notifiedUserId,
      },
    );

    const json = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(pullRequest, { json }, (data) => {
      consola.success(`Updated pull request #${data.number}: ${data.summary}`);
    });
  });

export default edit;
