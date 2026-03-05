import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Show a summary of issues assigned to you, grouped by status.

Fetches issues where you are the assignee and displays them organized by
their current status (e.g., Open, In Progress, Resolved).`,

  examples: [
    { description: "Show your issue status summary", command: "bee issue status" },
    { description: "Output as JSON", command: "bee issue status --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const status = withUsage(
  defineCommand({
    meta: {
      name: "status",
      description: "Show issue status summary for yourself",
    },
    args: {
      ...outputArgs,
    },
    async run({ args }) {
      const { client } = await getClient();

      const me = await client.getMyself();

      const issues = await client.getIssues({
        assigneeId: [me.id],
        count: 100,
      });

      if (issues.length === 0) {
        outputResult({ user: me, issues: [] }, args, () => {
          consola.info("No issues assigned to you.");
        });
        return;
      }

      outputResult({ user: me, issues }, args, (data) => {
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
    },
  }),
  commandUsage,
);

export { commandUsage, status };
