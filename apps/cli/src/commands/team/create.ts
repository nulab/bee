import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog team.

If \`--name\` is not provided, you will be prompted interactively.

Optionally specify \`--members\` with a comma-separated list of user IDs to
add members when creating the team.`,

  examples: [
    { description: "Create a team interactively", command: "bee team create" },
    { description: "Create a team with a name", command: 'bee team create --name "Design Team"' },
    {
      description: "Create a team with members",
      command: 'bee team create --name "Dev Team" --members 111,222,333',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create a team",
    },
    args: {
      ...outputArgs,
      name: {
        type: "string",
        alias: "n",
        description: "Team name",
      },
      members: {
        type: "string",
        description: "Comma-separated list of user IDs to add as members",
        valueHint: "<userId,...>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const name = await promptRequired("Team name:", args.name);
      const members = splitArg(args.members, v.number());

      const t = await client.postTeam({
        name,
        members,
      });

      outputResult(t, args, (data) => {
        consola.success(`Created team ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
