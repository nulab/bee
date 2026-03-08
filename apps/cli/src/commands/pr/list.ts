import { PR_STATUS_NAMES, PrStatusName, getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable, splitArg } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List pull requests")
  .description(
    `List pull requests in a Backlog repository.

By default, all pull requests are returned. Use \`--status\` to filter by
status (open, closed, merged).`,
  )
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("-S, --status <name>", "Status name (comma-separated for multiple)")
  .addOption(opt.assigneeList())
  .option("--issue <ids>", "Issue ID (comma-separated for multiple)")
  .option("--created-user <ids>", "Created user ID (comma-separated for multiple)")
  .addOption(opt.count())
  .addOption(opt.offset())
  .addOption(opt.json())
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
  .action(async (_opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client } = await getClient();

    const statusId = opts.status
      ? (opts.status as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => {
            const id = PrStatusName[name.toLowerCase()];
            if (id === undefined) {
              throw new Error(
                `Unknown status "${name}". Valid values: ${PR_STATUS_NAMES.join(", ")}`,
              );
            }
            return id;
          })
      : undefined;

    const assigneeId = ((opts.assignee as string[]) ?? [])
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    const issueId = splitArg(opts.issue as string | undefined, v.number());
    const createdUserId = splitArg(opts.createdUser as string | undefined, v.number());

    const pullRequests = await client.getPullRequests(opts.project as string, opts.repo as string, {
      statusId,
      assigneeId: assigneeId.length > 0 ? assigneeId : undefined,
      issueId: issueId.length > 0 ? issueId : undefined,
      createdUserId: createdUserId.length > 0 ? createdUserId : undefined,
      count: opts.count ? Number(opts.count) : undefined,
      offset: opts.offset ? Number(opts.offset) : undefined,
    });

    const json = opts.json === true ? "" : (opts.json as string | undefined);
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
