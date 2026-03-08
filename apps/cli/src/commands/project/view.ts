import { getClient, openOrPrintUrl, projectUrl } from "@repo/backlog-utils";
import { outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const view = new BeeCommand("view")
  .summary("View a project")
  .description(
    `Display details of a Backlog project.

Shows project settings including chart, subtasking, wiki, file sharing,
and git/subversion integration status.

Use \`--web\` to open the project in your default browser instead.`,
  )
  .addOption(opt.project())
  .addOption(opt.web("project"))
  .addOption(opt.noBrowser())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "View project details", command: "bee project view -p PROJECT_KEY" },
    { description: "Open project in browser", command: "bee project view -p PROJECT_KEY --web" },
    { description: "Output as JSON", command: "bee project view -p PROJECT_KEY --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);

    const { client, host } = await getClient();

    if (opts.web || opts.browser === false) {
      const url = projectUrl(host, opts.project);
      await openOrPrintUrl(url, opts.browser === false, consola);
      return;
    }

    const project = await client.getProject(opts.project);

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(project, { ...opts, json: jsonArg }, (data) => {
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
  });

export default view;
