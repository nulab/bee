import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const deleteProject = new BeeCommand("delete")
  .summary("Delete a project")
  .description(
    `Delete a Backlog project.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.

Requires Administrator role.`,
  )
  .argument("<project>", "Project ID or project key")
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Delete a project (with confirmation)",
      command: "bee project delete PROJECT_KEY",
    },
    {
      description: "Delete a project without confirmation",
      command: "bee project delete PROJECT_KEY --yes",
    },
  ])
  .action(async (project, opts) => {
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete project ${project}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient();

    const projectData = await client.deleteProject(project);

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(projectData, { ...opts, json: jsonArg }, (data) => {
      consola.success(`Deleted project ${data.projectKey}: ${data.name}`);
    });
  });

export default deleteProject;
