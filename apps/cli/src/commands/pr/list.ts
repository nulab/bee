import { PR_STATUS_NAMES, PrStatusName, getClient, resolveUserId } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { collect, collectNum } from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const resolveStatusIds = (statuses: string[]): number[] =>
  statuses.map((name) => {
    const id = PrStatusName[name.toLowerCase()];
    if (id === undefined) {
      throw new Error(`Unknown status "${name}". Valid values: ${PR_STATUS_NAMES.join(", ")}`);
    }
    return id;
  });

const list = new BeeCommand("list")
  .summary("List pull requests")
  .description(`Use \`--status\` to filter by status (open, closed, merged).`)
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("-S, --status <name>", "Status name (repeatable)", collect, [] satisfies string[])
  .addOption(opt.assigneeList())
  .option("--issue <id>", "Issue ID (repeatable)", collectNum, [] satisfies number[])
  .option("--created-user <id>", "Created user ID (repeatable)", collectNum, [] satisfies number[])
  .addOption(opt.count())
  .addOption(opt.offset())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    { description: "List pull requests", command: "bee pr list -p PROJECT -R repo" },
    {
      description: "List open pull requests only",
      command: "bee pr list -p PROJECT -R repo --status open",
    },
    {
      description: "List your assigned pull requests",
      command: "bee pr list -p PROJECT -R repo --assignee @me",
    },
    { description: "Output as JSON", command: "bee pr list -p PROJECT -R repo --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const statusId = opts.status.length > 0 ? resolveStatusIds(opts.status) : undefined;
    const assigneeId = await Promise.all(
      (opts.assignee ?? []).map((id: string) => resolveUserId(client, id)),
    );
    const issueId: number[] = opts.issue;
    const createdUserId: number[] = opts.createdUser;

    const pullRequests = await client.getPullRequests(opts.project, opts.repo, {
      statusId,
      assigneeId: assigneeId.length > 0 ? assigneeId : undefined,
      issueId: issueId.length > 0 ? issueId : undefined,
      createdUserId: createdUserId.length > 0 ? createdUserId : undefined,
      count: opts.count ? Number(opts.count) : undefined,
      offset: opts.offset ? Number(opts.offset) : undefined,
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(pullRequests, { json }, (data) => {
      if (data.length === 0) {
        consola.info("No pull requests found.");
        return;
      }

      const rows: Row[] = data.map((pr) => [
        { header: "#", value: String(pr.number) },
        { header: "STATUS", value: pr.status.name },
        { header: "ASSIGNEE", value: pr.assignee?.name ?? "Unassigned" },
        { header: "SUMMARY", value: pr.summary },
      ]);

      printTable(rows);
    });
  });

export default list;
