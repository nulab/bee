import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import { handleTeamWriteError } from "./warn-team-write-restriction";

const commandUsage: CommandUsage = {
  long: `Update an existing Backlog team.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.

When \`--members\` is specified, it replaces the entire member list with
the given user IDs.`,

  examples: [
    {
      description: "Rename a team",
      command: 'bee team edit 12345 --name "New Team Name"',
    },
    {
      description: "Replace team members",
      command: "bee team edit 12345 --members 111,222,333",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit a team",
    },
    args: {
      ...outputArgs,
      team: {
        type: "positional",
        description: "Team ID",
        required: true,
        valueHint: "<number>",
      },
      name: {
        type: "string",
        alias: "n",
        description: "New name of the team",
      },
      members: {
        type: "string",
        description: "Replace members with comma-separated list of user IDs",
        valueHint: "<userId,...>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const members = splitArg(args.members, v.number());

      let t;
      try {
        t = await client.patchTeam(Number(args.team), {
          name: args.name,
          members: members.length > 0 ? members : undefined,
        });
      } catch (error) {
        handleTeamWriteError(error);
        throw error;
      }

      outputResult(t, args, (data) => {
        consola.success(`Updated team ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
