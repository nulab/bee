import { PR_STATUS_NAMES, PrStatusName, getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
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
  long: `Count pull requests in a Backlog repository.

Accepts the same status filter as \`bee pr list\`. Outputs a plain number
by default, or a JSON object with \`--json\`.`,
  examples: [
    { description: "Count all pull requests", command: "bee pr count -p PROJECT -R repo" },
    {
      description: "Count open pull requests",
      command: "bee pr count -p PROJECT -R repo --status open",
    },
    { description: "Output as JSON", command: "bee pr count -p PROJECT -R repo --json" },
  ],
  annotations: { environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO] },
};

const count = withUsage(
  defineCommand({
    meta: {
      name: "count",
      description: "Count pull requests",
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

      const result = await client.getPullRequestsCount(args.project, args.repo, {
        statusId,
        assigneeId: assigneeId.length > 0 ? assigneeId : undefined,
        issueId: issueId.length > 0 ? issueId : undefined,
        createdUserId: createdUserId.length > 0 ? createdUserId : undefined,
      });

      outputResult(result, args, (data) => {
        consola.log(data.count);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, count };
