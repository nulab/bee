import { getClient, issueUrl, openOrPrintUrl } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const view = new BeeCommand("view")
  .summary("View an issue")
  .description(
    `Use \`--comments\` to include comments. Use \`--web\` to open in the browser.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .option("--comments", "Include comments")
  .addOption(opt.web("issue"))
  .addOption(opt.noBrowser())
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View issue details", command: "bee issue view PROJECT-123" },
    { description: "View with comments", command: "bee issue view PROJECT-123 --comments" },
    { description: "Open issue in browser", command: "bee issue view PROJECT-123 --web" },
    { description: "Output as JSON", command: "bee issue view PROJECT-123 --json" },
  ])
  .action(async (issue, opts) => {
    const { client, host } = await getClient();

    if (opts.web || opts.browser === false) {
      const url = issueUrl(host, issue);
      await openOrPrintUrl(url, opts.browser === false, consola);
      return;
    }

    const issueData = await client.getIssue(issue);

    const comments = opts.comments ? await client.getIssueComments(issue, { order: "asc" }) : [];

    outputResult(issueData, opts as { json?: string }, (data) => {
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
        ["Estimated", data.estimatedHours === undefined ? undefined : `${data.estimatedHours}h`],
        ["Actual", data.actualHours === undefined ? undefined : `${data.actualHours}h`],
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
  });

export default view;
