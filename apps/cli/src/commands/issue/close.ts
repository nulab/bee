import { IssueStatusId, ResolutionId, getClient } from "@repo/backlog-utils";
import { outputResult, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const close = new BeeCommand("close")
  .summary("Close an issue")
  .description(
    `Sets the status to Closed with resolution \`Fixed\` by default. Use \`--resolution\` for a different resolution.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .option("-c, --comment <text>", "Comment to add when closing")
  .option("--resolution <name>", `Resolution`)
  .addOption(opt.notify())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Close an issue", command: "bee issue close PROJECT-123" },
    {
      description: "Close with a comment",
      command: 'bee issue close PROJECT-123 -c "Done"',
    },
    {
      description: "Close as duplicate",
      command: "bee issue close PROJECT-123 --resolution duplicate",
    },
  ])
  .action(async (issue, opts) => {
    const { client } = await getClient(opts.space);

    const resolutionId = opts.resolution
      ? (ResolutionId[opts.resolution] ?? v.parse(vInteger, opts.resolution))
      : ResolutionId.fixed;

    const notifiedUserId = opts.notify ?? [];

    const issueData = await client.patchIssue(issue, {
      statusId: IssueStatusId.Closed,
      resolutionId,
      comment: opts.comment,
      notifiedUserId,
    });

    outputResult(issueData, opts as { json?: string }, (data) => {
      consola.success(`Closed issue ${data.issueKey}: ${data.summary}`);
    });
  });

export default close;
