import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const edit = new BeeCommand("edit")
  .summary("Edit a project")
  .description(
    `Update an existing Backlog project.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,
  )
  .argument("<project>", "Project ID or project key")
  .option("-n, --name <name>", "New name of the project")
  .option("-k, --key <key>", "New key of the project")
  .option("--chart-enabled", "Change whether the chart is enabled")
  .option("--subtasking-enabled", "Change whether subtasking is enabled")
  .option(
    "--project-leader-can-edit-project-leader",
    "Change whether project administrators can manage each other",
  )
  .option("--text-formatting-rule <rule>", "Change text formatting rule")
  .option("--archived", "Change whether the project is archived")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Rename a project",
      command: 'bee project edit PROJECT_KEY --name "New Name"',
    },
    {
      description: "Archive a project",
      command: "bee project edit PROJECT_KEY --archived",
    },
    {
      description: "Change formatting rule to markdown",
      command: "bee project edit PROJECT_KEY --text-formatting-rule markdown",
    },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const projectData = await client.patchProject(project, {
      name: opts.name,
      key: opts.key,
      chartEnabled: opts.chartEnabled,
      subtaskingEnabled: opts.subtaskingEnabled,
      projectLeaderCanEditProjectLeader: opts.projectLeaderCanEditProjectLeader,
      textFormattingRule: opts.textFormattingRule,
      archived: opts.archived,
    });

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(projectData, { ...opts, json: jsonArg }, (data) => {
      consola.success(`Updated project ${data.projectKey}: ${data.name}`);
    });
  });

export default edit;
