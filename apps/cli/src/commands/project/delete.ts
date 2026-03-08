import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const deleteProject = new BeeCommand("delete")
  .summary("Delete a project")
  .description(
    `Delete a Backlog project.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.

Requires Administrator role.`,
  )
  .addOption(opt.project())
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Delete a project (with confirmation)",
      command: "bee project delete -p PROJECT_KEY",
    },
    {
      description: "Delete a project without confirmation",
      command: "bee project delete -p PROJECT_KEY --yes",
    },
  ])
  .action(async (_opts, cmd) => {
    const opts = await resolveOptions(cmd);

    const confirmed = await confirmOrExit(
      `Are you sure you want to delete project ${opts.project}? This cannot be undone.`,
      opts.yes as boolean | undefined,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient();

    const project = await client.deleteProject(opts.project as string);

    const jsonArg = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(project, { ...opts, json: jsonArg }, (data) => {
      consola.success(`Deleted project ${data.projectKey}: ${data.name}`);
    });
  });

export default deleteProject;
