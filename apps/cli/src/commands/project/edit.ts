import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit a project")
  .description(`Only specified fields are updated; others remain unchanged.`)
  .addOption(opt.project())
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
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Rename a project",
      command: 'bee project edit -p PROJECT_KEY --name "New Name"',
    },
    {
      description: "Archive a project",
      command: "bee project edit -p PROJECT_KEY --archived",
    },
    {
      description: "Change formatting rule to markdown",
      command: "bee project edit -p PROJECT_KEY --text-formatting-rule markdown",
    },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const projectData = await client.patchProject(opts.project, {
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
