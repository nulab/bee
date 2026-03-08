import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit a milestone")
  .description(
    `Update an existing milestone in a Backlog project.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged. Use \`--archived\` to archive or \`--no-archived\` to
unarchive a milestone.`,
  )
  .argument("<milestone>", "Milestone ID")
  .addOption(opt.project())
  .requiredOption("-n, --name <value>", "New name of the milestone")
  .option("-d, --description <value>", "New description of the milestone")
  .option("--start-date <yyyy-MM-dd>", "New start date")
  .option("--release-due-date <yyyy-MM-dd>", "New release due date")
  .option("--archived", "Change whether the milestone is archived")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Rename a milestone",
      command: 'bee milestone edit 12345 -p PROJECT -n "v2.0.0"',
    },
    {
      description: "Archive a milestone",
      command: "bee milestone edit 12345 -p PROJECT --archived",
    },
    {
      description: "Update release date",
      command: "bee milestone edit 12345 -p PROJECT --release-due-date 2026-12-31",
    },
  ])
  .action(async (milestone, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const result = await client.patchVersions(opts.project, Number(milestone), {
      name: opts.name,
      description: opts.description,
      startDate: opts.startDate,
      releaseDueDate: opts.releaseDueDate,
      archived: opts.archived,
    });

    outputResult(result, opts, (data) => {
      consola.success(`Updated milestone ${data.name} (ID: ${data.id})`);
    });
  });

export default edit;
