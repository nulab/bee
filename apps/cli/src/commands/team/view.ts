import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog team.

Shows team name, ID, creator, creation date, and the list of members
belonging to the team.`,

  examples: [
    { description: "View team details", command: "bee team view 12345" },
    { description: "Output as JSON", command: "bee team view 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a team",
    },
    args: {
      ...outputArgs,
      team: {
        type: "positional",
        description: "Team ID",
        required: true,
        valueHint: "<number>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const t = await client.getTeam(Number(args.team));

      outputResult(t, args, (data) => {
        consola.log("");
        consola.log(`  ${data.name}`);
        consola.log("");
        printDefinitionList([
          ["ID", String(data.id)],
          ["Created by", data.createdUser?.name ?? "—"],
          ["Created", data.created],
          ["Updated", data.updated],
          ["Members", String(data.members.length)],
        ]);

        if (data.members.length > 0) {
          consola.log("");
          consola.log("  Members:");
          for (const member of data.members) {
            consola.log(`    - ${member.name} (${member.userId ?? member.id})`);
          }
        }

        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
