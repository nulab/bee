import { getClient, milestoneUrl } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const create = new BeeCommand("create")
  .summary("Create a milestone")
  .description(`Omitted fields will be prompted interactively.`)
  .addOption(opt.project())
  .option("-n, --name <value>", "Milestone name")
  .option("-d, --description <value>", "Milestone description")
  .option("--start-date <yyyy-MM-dd>", "Start date")
  .option("--release-due-date <yyyy-MM-dd>", "Release due date")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Create a milestone", command: 'bee milestone create -p PROJECT -n "v1.0.0"' },
    {
      description: "Create with dates",
      command:
        'bee milestone create -p PROJECT -n "v1.0.0" --start-date 2026-04-01 --release-due-date 2026-06-30',
    },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client, host } = await getClient(opts.space);

    const name = await promptRequired("Milestone name:", opts.name);

    const milestone = await client.postVersions(opts.project, {
      name,
      description: opts.description,
      startDate: opts.startDate,
      releaseDueDate: opts.releaseDueDate,
    });

    outputResult(milestone, opts, (data) => {
      consola.success(`Created milestone ${data.name} (ID: ${data.id})`);
      consola.info(milestoneUrl(host, data.id));
    });
  });

export default create;
