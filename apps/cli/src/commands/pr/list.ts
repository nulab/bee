import { PR_STATUS_NAMES, PrStatusName, getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import {
  type CommandUsage,
  ENV_AUTH,
  ENV_PROJECT,
  ENV_REPO,
  withUsage,
} from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List pull requests in a Backlog repository.

By default, all pull requests are returned. Use \`--status\` to filter by
status (open, closed, merged).`,

  examples: [
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
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List pull requests",
    },
    args: {
      ...outputArgs,
      project: { ...commonArgs.project, required: true },
      repo: commonArgs.repo,
      status: {
        type: "string",
        alias: "S",
        description: "Status name (comma-separated for multiple)",
        valueHint: `{${PR_STATUS_NAMES.join("|")}}`,
      },
      assignee: commonArgs.assigneeList,
      issue: {
        type: "string",
        description: "Issue ID (comma-separated for multiple)",
      },
      "created-user": {
        type: "string",
        description: "Created user ID (comma-separated for multiple)",
      },
      count: commonArgs.count,
      offset: commonArgs.offset,
    },
    async run({ args }) {
      const { client } = await getClient();

      const statusId = args.status
        ? args.status
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

      const assigneeId = splitArg(args.assignee, v.number());
      const issueId = splitArg(args.issue, v.number());
      const createdUserId = splitArg(args["created-user"], v.number());

      const pullRequests = await client.getPullRequests(args.project, args.repo, {
        statusId,
        assigneeId: assigneeId.length > 0 ? assigneeId : undefined,
        issueId: issueId.length > 0 ? issueId : undefined,
        createdUserId: createdUserId.length > 0 ? createdUserId : undefined,
        count: args.count ? Number(args.count) : undefined,
        offset: args.offset ? Number(args.offset) : undefined,
      });

      outputResult(pullRequests, args, (data) => {
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
    },
  }),
  commandUsage,
);

export { commandUsage, list };
