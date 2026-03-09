import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const deleteIssue = new BeeCommand("delete")
  .summary("Delete an issue")
  .description(`This action is irreversible.`)
  .argument("<issue>", "Issue ID or issue key")
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Delete an issue (with confirmation)",
      command: "bee issue delete PROJECT-123",
    },
    {
      description: "Delete an issue without confirmation",
      command: "bee issue delete PROJECT-123 --yes",
    },
  ])
  .action(async (issue, opts) => {
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete issue ${issue}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient();

    const issueData = await client.deleteIssue(issue);

    outputResult(issueData, opts as { json?: string }, (data) => {
      consola.success(`Deleted issue ${data.issueKey}: ${data.summary}`);
    });
  });

export default deleteIssue;
