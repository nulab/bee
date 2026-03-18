import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const deleteProject = new BeeCommand("delete")
  .summary("Delete a project")
  .description(`This action is irreversible. Requires Administrator role.`)
  .addOption(opt.project())
  .addOption(opt.json())
  .addOption(opt.space())
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
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete project ${opts.project}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const projectData = await client.deleteProject(opts.project);

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(projectData, { ...opts, json: jsonArg }, (data) => {
      consola.success(`Deleted project ${data.projectKey}: ${data.name}`);
    });
  });

export default deleteProject;
