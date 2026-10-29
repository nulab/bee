import { type BacklogClient, getClient, issueUrl, openOrPrintUrl } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import { type Entity } from "backlog-js";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const formatHours = (hours: number | null | undefined): string | undefined =>
  hours === null || hours === undefined ? undefined : `${hours}h`;

// The API returns at most 100 comments per request, so page through them by ID.
const COMMENTS_PAGE_SIZE = 100;

const getAllIssueComments = async (
  client: BacklogClient,
  issue: string,
): Promise<Entity.Issue.Comment[]> => {
  const comments: Entity.Issue.Comment[] = [];
  let page: Entity.Issue.Comment[];
  do {
    page = await client.getIssueComments(issue, {
      order: "asc",
      count: COMMENTS_PAGE_SIZE,
      minId: comments.at(-1)?.id,
    });
    comments.push(...page);
  } while (page.length === COMMENTS_PAGE_SIZE);
  return comments;
};

const view = new BeeCommand("view")
  .summary("View an issue")
  .description(`Use \`--comments\` to include all comments. Use \`--web\` to open in the browser.`)
  .argument("<issue>", "Issue ID or issue key")
  .option("--comments", "Include comments")
  .addOption(opt.web("issue"))
  .addOption(opt.noBrowser())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View issue details", command: "bee issue view PROJECT-123" },
    { description: "View with comments", command: "bee issue view PROJECT-123 --comments" },
    { description: "Open issue in browser", command: "bee issue view PROJECT-123 --web" },
    { description: "Output as JSON", command: "bee issue view PROJECT-123 --json" },
  ])
  .action(async (issue, opts) => {
    const { client, host } = await getClient(opts.space);

    if (opts.web || opts.browser === false) {
      const url = issueUrl(host, issue);
      await openOrPrintUrl(url, opts.browser === false, consola);
      return;
    }

    const issueData = await client.getIssue(issue);

    const comments = opts.comments ? await getAllIssueComments(client, issue) : [];

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
        ["Estimated", formatHours(data.estimatedHours)],
        ["Actual", formatHours(data.actualHours)],
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
