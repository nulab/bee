import { getClient, openUrl, projectUrl } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { projectsGet } from "@repo/openapi-client";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog project.

Shows project settings including chart, subtasking, wiki, file sharing,
and git/subversion integration status.

Use --web to open the project in your default browser instead of showing
details in the terminal.`,

  examples: [
    { description: "View project details", command: "bee project view PROJECT_KEY" },
    { description: "Open project in browser", command: "bee project view PROJECT_KEY --web" },
    { description: "Output as JSON", command: "bee project view PROJECT_KEY --json" },
  ],
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a project",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
      },
      web: {
        type: "boolean",
        alias: "w",
        description: "Open the project in the browser",
      },
    },
    async run({ args }) {
      const { client, host } = await getClient();

      if (args.web) {
        const url = projectUrl(host, args.project);
        await openUrl(url);
        consola.info(`Opening ${url} in your browser.`);
        return;
      }

      const { data: project } = await projectsGet({
        client,
        throwOnError: true,
        path: { projectIdOrKey: args.project },
      });

      outputResult(project, args, (data) => {
        consola.log("");
        consola.log(`  ${data.name} (${data.projectKey})`);
        consola.log("");
        consola.log(`    Status:              ${data.archived ? "Archived" : "Active"}`);
        consola.log(`    Text Formatting:     ${data.textFormattingRule}`);
        consola.log(`    Chart:               ${data.chartEnabled ? "Yes" : "No"}`);
        consola.log(`    Subtasking:          ${data.subtaskingEnabled ? "Yes" : "No"}`);
        consola.log(`    Wiki:                ${data.useWiki ? "Yes" : "No"}`);
        consola.log(`    File Sharing:        ${data.useFileSharing ? "Yes" : "No"}`);
        consola.log(`    Git:                 ${data.useGit ? "Yes" : "No"}`);
        consola.log(`    Subversion:          ${data.useSubversion ? "Yes" : "No"}`);
        consola.log(`    Dev Attributes:      ${data.useDevAttributes ? "Yes" : "No"}`);
        consola.log(`    Document:            ${data.useDocument ? "Yes" : "No"}`);
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
