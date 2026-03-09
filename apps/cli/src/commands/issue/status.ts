import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const status = new BeeCommand("status")
  .summary("Show issue status summary for yourself")
  .description(
    `Displays your assigned issues grouped by status (e.g., Open, In Progress, Resolved).`,
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Show your issue status summary", command: "bee issue status" },
    { description: "Output as JSON", command: "bee issue status --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const me = await client.getMyself();

    const issues = await client.getIssues({
      assigneeId: [me.id],
      count: 100,
    });

    if (issues.length === 0) {
      outputResult({ user: me, issues: [] }, opts as { json?: string }, () => {
        consola.info("No issues assigned to you.");
      });
      return;
    }

    outputResult({ user: me, issues }, opts as { json?: string }, (data) => {
      const grouped = new Map<string, typeof data.issues>();
      for (const issue of data.issues) {
        const { name } = issue.status;
        const group = grouped.get(name) ?? [];
        group.push(issue);
        grouped.set(name, group);
      }

      consola.log("");
      consola.log(`  Issues assigned to ${data.user.name}:`);
      consola.log("");

      for (const [statusName, statusIssues] of grouped) {
        consola.log(`  ${statusName} (${statusIssues.length}):`);
        for (const issue of statusIssues) {
          consola.log(`    ${issue.issueKey}  ${issue.summary}`);
        }
        consola.log("");
      }
    });
  });

export default status;
