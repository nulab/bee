import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const related = new BeeCommand("related")
  .summary("List related issues")
  .argument("<issue>", "Issue ID or issue key")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List related issues", command: "bee issue related PROJECT-123" },
    { description: "Output as JSON", command: "bee issue related PROJECT-123 --json" },
  ])
  .action(async (issue: string, opts) => {
    const { client } = await getClient(opts.space);

    const issues = await client.getRelatedIssues(issue);

    outputResult(issues, opts, (data) => {
      if (data.length === 0) {
        consola.info("No related issues found.");
        return;
      }

      const rows: Row[] = data.map((item) => [
        { header: "KEY", value: item.issueKey },
        { header: "STATUS", value: item.status?.name ?? "" },
        { header: "ASSIGNEE", value: item.assignee?.name ?? "Unassigned" },
        { header: "SUMMARY", value: item.summary },
      ]);

      printTable(rows);
    });
  });

export default related;
