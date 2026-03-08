import { IssueStatusId, getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const reopen = new BeeCommand("reopen")
  .summary("Reopen an issue")
  .description(`Sets the status back to Open.`)
  .argument("<issue>", "Issue ID or issue key")
  .option("-c, --comment <text>", "Comment to add when reopening")
  .addOption(opt.notify())
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Reopen an issue", command: "bee issue reopen PROJECT-123" },
    {
      description: "Reopen with a comment",
      command: 'bee issue reopen PROJECT-123 -c "Reopening due to regression"',
    },
  ])
  .action(async (issue, opts) => {
    const { client } = await getClient();

    const notifiedUserId = opts.notify ?? [];

    const issueData = await client.patchIssue(issue, {
      statusId: IssueStatusId.Open,
      comment: opts.comment,
      notifiedUserId,
    });

    outputResult(issueData, opts as { json?: string }, (data) => {
      consola.success(`Reopened issue ${data.issueKey}: ${data.summary}`);
    });
  });

export default reopen;
