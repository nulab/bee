import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const deleteTeam = new BeeCommand("delete")
  .summary("Delete a team")
  .description(
    `Delete a Backlog team.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,
  )
  .argument("<team>", "Team ID")
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Delete a team (with confirmation)",
      command: "bee team delete 12345",
    },
    {
      description: "Delete a team without confirmation",
      command: "bee team delete 12345 --yes",
    },
  ])
  .action(async (team, opts) => {
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete team ${team}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient();

    const t = await client.deleteTeam(Number(team));

    outputResult(t, opts, (data) => {
      consola.success(`Deleted team ${data.name} (ID: ${data.id})`);
    });
  });

export default deleteTeam;
