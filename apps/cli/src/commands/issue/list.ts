import {
  PRIORITY_NAMES,
  PriorityId,
  getClient,
  resolveProjectIds,
  resolveStatusId,
  resolveUserId,
} from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { Option } from "commander";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { collect } from "../../lib/common-options";

const resolvePriorityIds = (priorities: string[]): number[] =>
  priorities.map((name) => {
    const id = PriorityId[name.toLowerCase()];
    if (id === undefined) {
      throw new Error(`Unknown priority "${name}". Valid values: ${PRIORITY_NAMES.join(", ")}`);
    }
    return id;
  });

const list = new BeeCommand("list")
  .summary("List issues")
  .description(
    `List issues from one or more Backlog projects.

By default, issues are sorted by last updated date in descending order.
Use filtering flags to narrow results by assignee, status, priority, and more.

Multiple project keys can be specified as a comma-separated list.`,
  )
  .addOption(
    new Option(
      "-p, --project <id>",
      "Project ID or project key (comma-separated for multiple)",
    ).env("BACKLOG_PROJECT"),
  )
  .addOption(opt.assigneeList())
  .option(
    "-S, --status <name-or-id>",
    "Status name or ID (repeatable)",
    collect,
    [] satisfies string[],
  )
  .option("-P, --priority <name>", "Priority name (repeatable)", collect, [] satisfies string[])
  .addOption(opt.keyword())
  .option("--created-since <date>", "Show issues created on or after this date")
  .option("--created-until <date>", "Show issues created on or before this date")
  .option("--updated-since <date>", "Show issues updated on or after this date")
  .option("--updated-until <date>", "Show issues updated on or before this date")
  .option("--due-since <date>", "Show issues due on or after this date")
  .option("--due-until <date>", "Show issues due on or before this date")
  .option("--sort <field>", "Sort field")
  .addOption(opt.order())
  .addOption(opt.count())
  .addOption(opt.offset())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List issues in a project", command: "bee issue list -p PROJECT" },
    { description: "List your assigned issues", command: "bee issue list -p PROJECT -a @me" },
    {
      description: "Filter by keyword and priority",
      command: 'bee issue list -p PROJECT -k "login bug" --priority high',
    },
    { description: "Output as JSON", command: "bee issue list -p PROJECT --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const projectId = opts.project
      ? await resolveProjectIds(
          client,
          opts.project
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
        )
      : [];
    const assigneeId = await Promise.all(
      (opts.assignee ?? []).map((id: string) => resolveUserId(client, id)),
    );
    const projectForStatus = opts.project?.split(",")[0]?.trim();
    const statusId: number[] = await Promise.all(
      opts.status.map((s: string) => {
        if (projectForStatus) {
          return resolveStatusId(client, s, projectForStatus);
        }
        const n = Number(s);
        if (Number.isNaN(n)) {
          throw new Error("Status name requires --project (-p) to be specified.");
        }
        return n;
      }),
    );
    const priorityId = opts.priority.length > 0 ? resolvePriorityIds(opts.priority) : [];

    const issues = await client.getIssues({
      projectId,
      assigneeId,
      statusId,
      priorityId,
      keyword: opts.keyword,
      sort: opts.sort,
      order: opts.order,
      count: opts.count ? Number(opts.count) : undefined,
      offset: opts.offset ? Number(opts.offset) : undefined,
      createdSince: opts.createdSince,
      createdUntil: opts.createdUntil,
      updatedSince: opts.updatedSince,
      updatedUntil: opts.updatedUntil,
      dueDateSince: opts.dueSince,
      dueDateUntil: opts.dueUntil,
    });

    outputResult(issues, { json: opts.json }, (data) => {
      if (data.length === 0) {
        consola.info("No issues found.");
        return;
      }

      const rows: Row[] = data.map((issue) => [
        { header: "KEY", value: issue.issueKey },
        { header: "STATUS", value: issue.status.name },
        { header: "TYPE", value: issue.issueType.name },
        { header: "PRIORITY", value: issue.priority.name },
        { header: "ASSIGNEE", value: issue.assignee?.name ?? "Unassigned" },
        { header: "SUMMARY", value: issue.summary },
      ]);

      printTable(rows);
    });
  });

export default list;
