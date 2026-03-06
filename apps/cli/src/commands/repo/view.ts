import { getClient, openUrl, repositoryUrl } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Display details of a Git repository in a Backlog project.

Shows repository name, description, HTTP and SSH clone URLs, size,
creation and update timestamps.

Use \`--web\` to open the repository in your default browser instead.`,

  examples: [
    {
      description: "View repository details",
      command: "bee repo view api-server -p PROJECT_KEY",
    },
    {
      description: "Open repository in browser",
      command: "bee repo view api-server -p PROJECT_KEY --web",
    },
    { description: "Output as JSON", command: "bee repo view api-server -p PROJECT_KEY --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a repository",
    },
    args: {
      ...outputArgs,
      repository: {
        type: "positional",
        description: "Repository name or ID",
        required: true,
      },
      project: { ...commonArgs.project, required: true },
      web: commonArgs.web("repository"),
    },
    async run({ args }) {
      const { client, host } = await getClient();

      if (args.web) {
        const url = repositoryUrl(host, args.project, args.repository);
        await openUrl(url);
        consola.info(`Opening ${url} in your browser.`);
        return;
      }

      const repo = await client.getGitRepository(args.project, args.repository);

      outputResult(repo, args, (data) => {
        consola.log("");
        consola.log(`  ${data.name}`);
        consola.log("");
        printDefinitionList([
          ["Description", data.description ?? ""],
          ["HTTP URL", data.httpUrl],
          ["SSH URL", data.sshUrl],
          ["Created", formatDate(data.created)],
          ["Updated", formatDate(data.updated)],
          ["Last Pushed", data.pushedAt ? formatDate(data.pushedAt) : ""],
        ]);
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
