import { getClient } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import { collectNum } from "../../lib/common-options";
import * as opt from "../../lib/common-options";
import { handleTeamWriteError } from "./warn-team-write-restriction";

const create = new BeeCommand("create")
  .summary("Create a team")
  .description(
    `Create a new Backlog team.

If \`--name\` is not provided, you will be prompted interactively.

Optionally specify \`--members\` with user IDs (repeatable) to add members
when creating the team.`,
  )
  .option("-n, --name <name>", "Team name")
  .option("--members <id>", "User IDs to add as members (repeatable)", collectNum, [] as number[])
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Create a team interactively", command: "bee team create" },
    { description: "Create a team with a name", command: 'bee team create --name "Design Team"' },
    {
      description: "Create a team with members",
      command: 'bee team create --name "Dev Team" --members 111 --members 222 --members 333',
    },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const name = await promptRequired("Team name:", opts.name);
    const { members } = opts;

    let t;
    try {
      t = await client.postTeam({
        name,
        members: members.length > 0 ? members : undefined,
      });
    } catch (error) {
      handleTeamWriteError(error);
      throw error;
    }

    outputResult(t, opts, (data) => {
      consola.success(`Created team ${data.name} (ID: ${data.id})`);
    });
  });

export default create;
