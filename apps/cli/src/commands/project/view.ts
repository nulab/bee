import { getClient, openUrl, projectUrl } from "@repo/backlog-utils";
import { outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog project.

Shows project settings including chart, subtasking, wiki, file sharing,
and git/subversion integration status.

Use \`--web\` to open the project in your default browser instead.`,

  examples: [
    { description: "View project details", command: "bee project view PROJECT_KEY" },
    { description: "Open project in browser", command: "bee project view PROJECT_KEY --web" },
    { description: "Output as JSON", command: "bee project view PROJECT_KEY --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a project",
    },
    args: {
      ...outputArgs,
      project: commonArgs.projectPositional,
      web: commonArgs.web("project"),
    },
    async run({ args }) {
      const { client, host } = await getClient();

      if (args.web) {
        const url = projectUrl(host, args.project);
        await openUrl(url);
        consola.info(`Opening ${url} in your browser.`);
        return;
      }

      const project = await client.getProject(args.project);

      outputResult(project, args, (data) => {
        consola.log("");
        consola.log(`  ${data.name} (${data.projectKey})`);
        consola.log("");
        printDefinitionList([
          ["Status", data.archived ? "Archived" : "Active"],
          ["Text Formatting", data.textFormattingRule],
          ["Chart", data.chartEnabled ? "Yes" : "No"],
          ["Subtasking", data.subtaskingEnabled ? "Yes" : "No"],
          ["Wiki", data.useWiki ? "Yes" : "No"],
          ["File Sharing", data.useFileSharing ? "Yes" : "No"],
          ["Git", data.useGit ? "Yes" : "No"],
          ["Subversion", data.useSubversion ? "Yes" : "No"],
          ["Dev Attributes", data.useDevAttributes ? "Yes" : "No"],
        ]);
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
