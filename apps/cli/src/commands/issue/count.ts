import {
  PRIORITY_NAMES,
  PriorityId,
  getClient,
  resolveProjectIds,
  resolveStatusId,
  resolveUserId,
} from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
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

const count = new BeeCommand("count")
  .summary("Count issues")
  .description(
    `Count issues matching the given filter criteria.

Accepts the same filter flags as \`bee issue list\`. Outputs a plain number
by default, or a JSON object with \`--json\`.`,
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
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Count all issues in a project", command: "bee issue count -p PROJECT" },
    {
      description: "Count open bugs assigned to you",
      command: 'bee issue count -p PROJECT -a @me -k "bug"',
    },
    { description: "Output as JSON", command: "bee issue count -p PROJECT --json" },
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
    const projectForStatus = opts.project?.split(",")[0]?.trim() || undefined;
    const statusId: number[] = await Promise.all(
      opts.status.map((s: string) => resolveStatusId(client, s, projectForStatus)),
    );
    const priorityId = opts.priority.length > 0 ? resolvePriorityIds(opts.priority) : [];

    const result = await client.getIssuesCount({
      projectId,
      assigneeId,
      statusId,
      priorityId,
      keyword: opts.keyword,
      createdSince: opts.createdSince,
      createdUntil: opts.createdUntil,
      updatedSince: opts.updatedSince,
      updatedUntil: opts.updatedUntil,
      dueDateSince: opts.dueSince,
      dueDateUntil: opts.dueUntil,
    });

    outputResult(result, { json: opts.json }, (data) => {
      consola.log(data.count);
    });
  });

export default count;
