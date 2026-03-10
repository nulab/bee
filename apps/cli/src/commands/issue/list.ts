import {
  PRIORITY_NAMES,
  PriorityId,
  getClient,
  resolveProjectIds,
  resolveUserId,
} from "@repo/backlog-utils";
import { type Row, outputResult, printTable, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { Option } from "commander";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { collect, collectNum } from "../../lib/common-options";

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
    `By default, sorted by last updated date in descending order. Multiple project keys can be comma-separated.`,
  )
  .addOption(
    new Option(
      "-p, --project <id>",
      "Project ID or project key (comma-separated for multiple)",
    ).env("BACKLOG_PROJECT"),
  )
  .addOption(opt.assigneeList())
  .option("-S, --status <id>", "Status ID (repeatable)", collectNum, [] satisfies number[])
  .option("-P, --priority <name>", "Priority name (repeatable)", collect, [] satisfies string[])
  .option("-T, --type <id>", "Issue type ID (repeatable)", collectNum, [] satisfies number[])
  .option("--category <id>", "Category ID (repeatable)", collectNum, [] satisfies number[])
  .option("--version <id>", "Version ID (repeatable)", collectNum, [] satisfies number[])
  .option("--milestone <id>", "Milestone ID (repeatable)", collectNum, [] satisfies number[])
  .option("--resolution <id>", "Resolution ID (repeatable)", collectNum, [] satisfies number[])
  .option("--parent-issue <id>", "Parent issue ID (repeatable)", collectNum, [] satisfies number[])
  .addOption(opt.keyword())
  .option("--created-since <date>", "Show issues created on or after this date")
  .option("--created-until <date>", "Show issues created on or before this date")
  .option("--updated-since <date>", "Show issues updated on or after this date")
  .option("--updated-until <date>", "Show issues updated on or before this date")
  .option("--start-since <date>", "Show issues starting on or after this date")
  .option("--start-until <date>", "Show issues starting on or before this date")
  .option("--due-since <date>", "Show issues due on or after this date")
  .option("--due-until <date>", "Show issues due on or before this date")
  .option("--sort <field>", "Sort field")
  .addOption(opt.order())
  .addOption(opt.count())
  .addOption(opt.offset())
  .addOption(opt.json())
  .addOption(opt.space())
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
    const { client } = await getClient(opts.space);

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
    const statusId: number[] = opts.status;
    const priorityId = opts.priority.length > 0 ? resolvePriorityIds(opts.priority) : [];
    const issueTypeId: number[] = opts.type;
    const categoryId: number[] = opts.category;
    const versionId: number[] = opts.version;
    const milestoneId: number[] = opts.milestone;
    const resolutionId: number[] = opts.resolution;
    const parentIssueId: number[] = opts.parentIssue;

    const issues = await client.getIssues({
      projectId,
      assigneeId,
      statusId,
      priorityId,
      issueTypeId,
      categoryId,
      versionId,
      milestoneId,
      resolutionId,
      parentIssueId,
      keyword: opts.keyword,
      sort: opts.sort,
      order: opts.order,
      count: v.parse(v.optional(vInteger), opts.count),
      offset: v.parse(v.optional(vInteger), opts.offset),
      createdSince: opts.createdSince,
      createdUntil: opts.createdUntil,
      updatedSince: opts.updatedSince,
      updatedUntil: opts.updatedUntil,
      startDateSince: opts.startSince,
      startDateUntil: opts.startUntil,
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
        { header: "STATUS", value: issue.status?.name ?? "" },
        { header: "TYPE", value: issue.issueType?.name ?? "" },
        { header: "PRIORITY", value: issue.priority?.name ?? "" },
        { header: "ASSIGNEE", value: issue.assignee?.name ?? "Unassigned" },
        { header: "SUMMARY", value: issue.summary },
      ]);

      printTable(rows);
    });
  });

export default list;
