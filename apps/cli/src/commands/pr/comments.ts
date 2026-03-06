import { getClient } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import {
  type CommandUsage,
  ENV_AUTH,
  ENV_PROJECT,
  ENV_REPO,
  withUsage,
} from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List comments on a Backlog pull request.

Displays all comments in chronological order with the author and date.`,

  examples: [
    {
      description: "List pull request comments",
      command: "bee pr comments 42 -p PROJECT -R repo",
    },
    { description: "Output as JSON", command: "bee pr comments 42 -p PROJECT -R repo --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const comments = withUsage(
  defineCommand({
    meta: {
      name: "comments",
      description: "List comments on a pull request",
    },
    args: {
      ...outputArgs,
      number: {
        type: "positional",
        description: "Pull request number",
        valueHint: "<number>",
        required: true,
      },
      project: { ...commonArgs.project, required: true },
      repo: commonArgs.repo,
      "min-id": commonArgs.minId,
      "max-id": commonArgs.maxId,
      count: commonArgs.count,
      order: commonArgs.order,
    },
    async run({ args }) {
      const { client } = await getClient();

      const prNumber = Number(args.number);

      const prComments = await client.getPullRequestComments(args.project, args.repo, prNumber, {
        minId: args["min-id"] ? Number(args["min-id"]) : undefined,
        maxId: args["max-id"] ? Number(args["max-id"]) : undefined,
        order: (args.order as "asc" | "desc") ?? "asc",
        count: args.count ? Number(args.count) : undefined,
      });

      outputResult(prComments, args, (data) => {
        const contentComments = data.filter((c) => c.content);

        if (contentComments.length === 0) {
          consola.info("No comments found.");
          return;
        }

        consola.log("");
        for (const comment of contentComments) {
          consola.log(`  ${comment.createdUser.name} (${formatDate(comment.created)}):`);
          consola.log(
            comment.content
              .split("\n")
              .map((line) => `    ${line}`)
              .join("\n"),
          );
          consola.log("");
        }
      });
    },
  }),
  commandUsage,
);

export { commandUsage, comments };
