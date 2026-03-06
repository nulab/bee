import { PrStatusId, getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import {
  type CommandUsage,
  ENV_AUTH,
  ENV_PROJECT,
  ENV_REPO,
  withUsage,
} from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Show a summary of pull requests assigned to you, grouped by status.

Fetches pull requests where you are the assignee and displays them
organized by their current status (Open, Closed, Merged).`,

  examples: [
    {
      description: "Show your pull request status summary",
      command: "bee pr status -p PROJECT -R repo",
    },
    { description: "Output as JSON", command: "bee pr status -p PROJECT -R repo --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const status = withUsage(
  defineCommand({
    meta: {
      name: "status",
      description: "Show pull request status summary for yourself",
    },
    args: {
      ...outputArgs,
      project: {
        type: "string",
        alias: "p",
        description: "Project ID or project key",
        default: process.env.BACKLOG_PROJECT,
        required: true,
      },
      repo: {
        type: "string",
        alias: "R",
        description: "Repository name or ID",
        default: process.env.BACKLOG_REPO,
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const me = await client.getMyself();

      const pullRequests = await client.getPullRequests(args.project, args.repo, {
        assigneeId: [me.id],
        statusId: [PrStatusId.Open, PrStatusId.Closed, PrStatusId.Merged],
        count: 100,
      });

      if (pullRequests.length === 0) {
        outputResult({ user: me, pullRequests: [] }, args, () => {
          consola.info("No pull requests assigned to you.");
        });
        return;
      }

      outputResult({ user: me, pullRequests }, args, (data) => {
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
    },
  }),
  commandUsage,
);

export { commandUsage, status };
