import { PR_STATUS_NAMES, PrStatusName, getClient, resolveUserId } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
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

const count = new BeeCommand("count")
  .summary("Count pull requests")
  .description(
    `Count pull requests in a Backlog repository.

Accepts the same status filter as \`bee pr list\`. Outputs a plain number
by default, or a JSON object with \`--json\`.`,
  )
  .addOption(opt.project())
  .addOption(opt.repo())
  .option("-S, --status <name>", "Status name (repeatable)", collect, [] satisfies string[])
  .addOption(opt.assigneeList())
  .option("--issue <id>", "Issue ID (repeatable)", collectNum, [] satisfies number[])
  .option("--created-user <id>", "Created user ID (repeatable)", collectNum, [] satisfies number[])
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    { description: "Count all pull requests", command: "bee pr count -p PROJECT -R repo" },
    {
      description: "Count open pull requests",
      command: "bee pr count -p PROJECT -R repo --status open",
    },
    { description: "Output as JSON", command: "bee pr count -p PROJECT -R repo --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const statusId = opts.status.length > 0 ? resolveStatusIds(opts.status) : undefined;
    const assigneeId = await Promise.all(
      (opts.assignee ?? []).map((id: string) => resolveUserId(client, id)),
    );
    const issueId: number[] = opts.issue;
    const createdUserId: number[] = opts.createdUser;

    const result = await client.getPullRequestsCount(opts.project, opts.repo, {
      statusId,
      assigneeId: assigneeId.length > 0 ? assigneeId : undefined,
      issueId: issueId.length > 0 ? issueId : undefined,
      createdUserId: createdUserId.length > 0 ? createdUserId : undefined,
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(result, { json }, (data) => {
      consola.log(data.count);
    });
  });

export default count;
