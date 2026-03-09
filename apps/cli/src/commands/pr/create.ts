import { getClient, pullRequestUrl, resolveUserId } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const create = new BeeCommand("create")
  .summary("Create a pull request")
  .description(
    `Create a new pull request in a Backlog repository.

Requires a base branch, head branch, title, and description. When run
interactively, omitted required fields will be prompted.`,
  )
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("--base <branch>", "Base branch name")
  .option("--head <branch>", "Head branch name")
  .option("-t, --title <text>", "Pull request title")
  .option("-b, --body <text>", "Pull request description")
  .addOption(opt.assignee())
  .option("--issue <key>", "Related issue ID or issue key")
  .addOption(opt.notify())
  .addOption(opt.attachment())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    {
      description: "Create a pull request",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Add login" -b "Details"',
    },
    {
      description: "Create a pull request assigned to yourself",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Title" -b "Desc" --assignee @me',
    },
    {
      description: "Create a pull request linked to an issue",
      command:
        'bee pr create -p PROJECT -R repo --base main --head feature -t "Title" -b "Desc" --issue 123',
    },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client, host } = await getClient(opts.space);

    const base = await promptRequired("Base branch:", opts.base);
    const head = await promptRequired("Head branch:", opts.head);
    const summary = await promptRequired("Summary:", opts.title);
    const description = await promptRequired("Body:", opts.body);

    const assigneeId = opts.assignee ? await resolveUserId(client, opts.assignee) : undefined;
    const notifiedUserId = opts.notify ?? [];
    const attachmentId = opts.attachment ?? [];

    let issueId: number | undefined;
    if (opts.issue) {
      if (Number.isNaN(Number(opts.issue))) {
        const issue = await client.getIssue(opts.issue);
        issueId = issue.id;
      } else {
        issueId = Number(opts.issue);
      }
    }

    const pullRequest = await client.postPullRequest(opts.project, opts.repo, {
      summary,
      description,
      base,
      branch: head,
      issueId,
      assigneeId,
      notifiedUserId,
      attachmentId,
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(pullRequest, { json }, (data) => {
      consola.success(`Created pull request #${data.number}: ${data.summary}`);
      consola.info(pullRequestUrl(host, opts.project, opts.repo, data.number));
    });
  });

export default create;
