import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const deleteMilestone = new BeeCommand("delete")
  .summary("Delete a milestone")
  .description(`This action is irreversible.`)
  .argument("<milestone>", "Milestone ID")
  .addOption(opt.project())
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Delete a milestone (with confirmation)",
      command: "bee milestone delete 12345 -p PROJECT",
    },
    {
      description: "Delete without confirmation",
      command: "bee milestone delete 12345 -p PROJECT --yes",
    },
  ])
  .action(async (milestone, opts, cmd) => {
    await resolveOptions(cmd);
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete milestone ${milestone}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const result = await client.deleteVersions(opts.project, Number(milestone));

    outputResult(result, opts, (data) => {
      consola.success(`Deleted milestone ${data.name} (ID: ${data.id})`);
    });
  });

export default deleteMilestone;
