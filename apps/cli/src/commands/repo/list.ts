import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List Git repositories in a Backlog project.

By default, repositories are listed in the configured display order.`,

  examples: [
    { description: "List repositories in a project", command: "bee repo list PROJECT_KEY" },
    { description: "Output as JSON", command: "bee repo list PROJECT_KEY --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List repositories in a project",
    },
    args: {
      ...outputArgs,
      project: commonArgs.projectPositional,
    },
    async run({ args }) {
      const { client } = await getClient();

      const repos = await client.getGitRepositories(args.project);

      outputResult(repos, args, (data) => {
        if (data.length === 0) {
          consola.info("No repositories found.");
          return;
        }

        const rows: Row[] = data.map((repo) => [
          { header: "NAME", value: repo.name },
          { header: "DESCRIPTION", value: repo.description ?? "" },
          { header: "LAST PUSHED", value: repo.pushedAt?.slice(0, 10) ?? "" },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
