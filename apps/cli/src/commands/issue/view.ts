import { getClient, issueUrl, openUrl } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult } from "@repo/cli-utils";
import { issuesGet, issuesGetComments } from "@repo/openapi-client";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog issue.

Shows the issue summary, status, type, priority, assignee, dates, and
description. Use --comments to also fetch and display comments.

Use --web to open the issue in your default browser instead of showing
details in the terminal.`,

  examples: [
    { description: "View issue details", command: "bee issue view PROJECT-123" },
    { description: "View with comments", command: "bee issue view PROJECT-123 --comments" },
    { description: "Open issue in browser", command: "bee issue view PROJECT-123 --web" },
    { description: "Output as JSON", command: "bee issue view PROJECT-123 --json" },
  ],
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
        description: "Issue key or ID. e.g., PROJECT-123",
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

      const { data: issue } = await issuesGet({
        client,
        throwOnError: true,
        path: { issueIdOrKey: args.issue },
      });

      const comments = args.comments
        ? (
            await issuesGetComments({
              client,
              throwOnError: true,
              path: { issueIdOrKey: args.issue },
              query: { order: "asc" },
            })
          ).data
        : [];

      outputResult(issue, args, (data) => {
        consola.log("");
        consola.log(`  ${data.issueKey}: ${data.summary}`);
        consola.log("");
        consola.log(`    Status:      ${data.status.name}`);
        consola.log(`    Type:        ${data.issueType.name}`);
        consola.log(`    Priority:    ${data.priority.name}`);
        consola.log(`    Assignee:    ${data.assignee?.name ?? "Unassigned"}`);
        consola.log(`    Created by:  ${data.createdUser?.name ?? "Unknown"}`);
        consola.log(`    Created:     ${formatDate(data.created)}`);
        consola.log(`    Updated:     ${formatDate(data.updated)}`);

        if (data.startDate) {
          consola.log(`    Start Date:  ${formatDate(data.startDate)}`);
        }
        if (data.dueDate) {
          consola.log(`    Due Date:    ${formatDate(data.dueDate)}`);
        }
        if (data.estimatedHours != null) {
          consola.log(`    Estimated:   ${data.estimatedHours}h`);
        }
        if (data.actualHours != null) {
          consola.log(`    Actual:      ${data.actualHours}h`);
        }
        if (data.category.length > 0) {
          consola.log(`    Categories:  ${data.category.map((c) => c.name).join(", ")}`);
        }
        if (data.milestone.length > 0) {
          consola.log(`    Milestones:  ${data.milestone.map((m) => m.name).join(", ")}`);
        }
        if (data.version.length > 0) {
          consola.log(`    Versions:    ${data.version.map((v) => v.name).join(", ")}`);
        }

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
