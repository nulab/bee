import { getClient, issueUrl, openUrl } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog issue.

Shows the issue summary, status, type, priority, assignee, dates, and
description. Use \`--comments\` to also fetch and display comments.

Use \`--web\` to open the issue in your default browser instead.`,

  examples: [
    { description: "View issue details", command: "bee issue view PROJECT-123" },
    { description: "View with comments", command: "bee issue view PROJECT-123 --comments" },
    { description: "Open issue in browser", command: "bee issue view PROJECT-123 --web" },
    { description: "Output as JSON", command: "bee issue view PROJECT-123 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View an issue",
    },
    args: {
      ...outputArgs,
      issue: {
        type: "positional",
        description: "Issue ID or issue key",
        valueHint: "<PROJECT-123>",
        required: true,
      },
      comments: {
        type: "boolean",
        description: "Include comments",
      },
      web: {
        type: "boolean",
        alias: "w",
        description: "Open the issue in the browser",
      },
    },
    async run({ args }) {
      const { client, host } = await getClient();

      if (args.web) {
        const url = issueUrl(host, args.issue);
        await openUrl(url);
        consola.info(`Opening ${url} in your browser.`);
        return;
      }

      const issue = await client.getIssue(args.issue);

      const comments = args.comments
        ? await client.getIssueComments(args.issue, { order: "asc" })
        : [];

      outputResult(issue, args, (data) => {
        consola.log("");
        consola.log(`  ${data.issueKey}: ${data.summary}`);
        consola.log("");
        printDefinitionList([
          ["Status", data.status.name],
          ["Type", data.issueType.name],
          ["Priority", data.priority.name],
          ["Assignee", data.assignee?.name ?? "Unassigned"],
          ["Created by", data.createdUser?.name ?? "Unknown"],
          ["Created", formatDate(data.created)],
          ["Updated", formatDate(data.updated)],
          ["Start Date", data.startDate ? formatDate(data.startDate) : undefined],
          ["Due Date", data.dueDate ? formatDate(data.dueDate) : undefined],
          ["Estimated", data.estimatedHours !== undefined ? `${data.estimatedHours}h` : undefined],
          ["Actual", data.actualHours !== undefined ? `${data.actualHours}h` : undefined],
          [
            "Categories",
            data.category.length > 0 ? data.category.map((c) => c.name).join(", ") : undefined,
          ],
          [
            "Milestones",
            data.milestone.length > 0 ? data.milestone.map((m) => m.name).join(", ") : undefined,
          ],
          [
            "Versions",
            data.versions && data.versions.length > 0
              ? data.versions.map((v: { name: string }) => v.name).join(", ")
              : undefined,
          ],
        ]);

        if (data.description) {
          consola.log("");
          consola.log("  Description:");
          consola.log(
            data.description
              .split("\n")
              .map((line) => `    ${line}`)
              .join("\n"),
          );
        }

        if (comments.length > 0) {
          consola.log("");
          consola.log("  Comments:");
          for (const comment of comments) {
            if (!comment.content) {
              continue;
            }
            consola.log("");
            consola.log(`    ${comment.createdUser.name} (${formatDate(comment.created)}):`);
            consola.log(
              comment.content
                .split("\n")
                .map((line) => `      ${line}`)
                .join("\n"),
            );
          }
        }

        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
