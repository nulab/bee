import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import { collectNum } from "../../lib/common-options";
import * as opt from "../../lib/common-options";
import { handleTeamWriteError } from "./warn-team-write-restriction";

const edit = new BeeCommand("edit")
  .summary("Edit a team")
  .description(
    `Update an existing Backlog team.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.

When \`--members\` is specified, it replaces the entire member list with
the given user IDs.`,
  )
  .argument("<team>", "Team ID")
  .option("-n, --name <name>", "New name of the team")
  .option(
    "--members <id>",
    "Replace members with user IDs (repeatable)",
    collectNum,
    [] as number[],
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Rename a team",
      command: 'bee team edit 12345 --name "New Team Name"',
    },
    {
      description: "Replace team members",
      command: "bee team edit 12345 --members 111 --members 222 --members 333",
    },
  ])
  .action(async (team, opts) => {
    const { client } = await getClient();

    const { members } = opts;

    let t;
    try {
      t = await client.patchTeam(Number(team), {
        name: opts.name,
        members: members.length > 0 ? members : undefined,
      });
    } catch (error) {
      handleTeamWriteError(error);
      throw error;
    }

    outputResult(t, opts, (data) => {
      consola.success(`Updated team ${data.name} (ID: ${data.id})`);
    });
  });

export default edit;
