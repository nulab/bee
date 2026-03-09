import { PrStatusId, getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const status = new BeeCommand("status")
  .summary("Show pull request status summary for yourself")
  .description(
    `Show a summary of pull requests assigned to you, grouped by status.

Fetches pull requests where you are the assignee and displays them
organized by their current status (Open, Closed, Merged).`,
  )
  .addOption(opt.project())
  .addOption(opt.repo())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    {
      description: "Show your pull request status summary",
      command: "bee pr status -p PROJECT -R repo",
    },
    { description: "Output as JSON", command: "bee pr status -p PROJECT -R repo --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const me = await client.getMyself();

    const pullRequests = await client.getPullRequests(opts.project, opts.repo, {
      assigneeId: [me.id],
      statusId: [PrStatusId.Open, PrStatusId.Closed, PrStatusId.Merged],
      count: 100,
    });

    const json = opts.json === true ? "" : opts.json;

    if (pullRequests.length === 0) {
      outputResult({ user: me, pullRequests: [] }, { json }, () => {
        consola.info("No pull requests assigned to you.");
      });
      return;
    }

    outputResult({ user: me, pullRequests }, { json }, (data) => {
      const grouped = new Map<string, typeof data.pullRequests>();
      for (const pr of data.pullRequests) {
        const { name } = pr.status;
        const group = grouped.get(name) ?? [];
        group.push(pr);
        grouped.set(name, group);
      }

      consola.log("");
      consola.log(`  Pull requests assigned to ${data.user.name}:`);
      consola.log("");

      for (const [statusName, statusPrs] of grouped) {
        consola.log(`  ${statusName} (${statusPrs.length}):`);
        for (const pr of statusPrs) {
          consola.log(`    #${pr.number}  ${pr.summary}`);
        }
        consola.log("");
      }
    });
  });

export default status;
