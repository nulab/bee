import { getClient, openUrl, pullRequestUrl } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
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
  long: `Display details of a Backlog pull request.

Shows the pull request summary, status, assignee, base/head branches,
and description.

Use \`--web\` to open the pull request in your default browser instead.`,

  examples: [
    { description: "View pull request details", command: "bee pr view 42 -p PROJECT -R repo" },
    {
      description: "Open pull request in browser",
      command: "bee pr view 42 -p PROJECT -R repo --web",
    },
    { description: "Output as JSON", command: "bee pr view 42 -p PROJECT -R repo --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT, ENV_REPO],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a pull request",
    },
    args: {
      ...outputArgs,
      number: {
        type: "positional",
        description: "Pull request number",
        valueHint: "<number>",
        required: true,
      },
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
        description: "Repository name",
        default: process.env.BACKLOG_REPO,
        required: true,
      },
      web: {
        type: "boolean",
        alias: "w",
        description: "Open the pull request in the browser",
      },
    },
    async run({ args }) {
      const { client, host } = await getClient();

      const prNumber = Number(args.number);

      if (args.web) {
        const url = pullRequestUrl(host, args.project, args.repo, prNumber);
        await openUrl(url);
        consola.info(`Opening ${url} in your browser.`);
        return;
      }

      const pullRequest = await client.getPullRequest(args.project, args.repo, prNumber);

      outputResult(pullRequest, args, (data) => {
        consola.log("");
        consola.log(`  #${data.number}: ${data.summary}`);
        consola.log("");
        printDefinitionList([
          ["Status", data.status.name],
          ["Base", data.base],
          ["Head", data.branch],
          ["Assignee", data.assignee?.name ?? "Unassigned"],
          ["Created by", data.createdUser?.name ?? "Unknown"],
          ["Created", formatDate(data.created)],
          ["Updated", formatDate(data.updated)],
          ["Merged at", data.mergeAt ? formatDate(data.mergeAt) : undefined],
          ["Closed at", data.closeAt ? formatDate(data.closeAt) : undefined],
        ]);

        if (data.description) {
          consola.log("");
          consola.log("  Description:");
          consola.log(
            data.description
              .split("\n")
              .map((line) => `    ${line}`)
              .join("\n"),
          );
        }

        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
