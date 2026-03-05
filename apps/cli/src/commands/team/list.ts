import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List teams in the space.

Teams are groups of users that can be assigned to projects collectively.
Use \`--order\` to control sort direction and \`--offset\` / \`--count\` for
pagination.`,

  examples: [
    { description: "List all teams", command: "bee team list" },
    { description: "List teams in descending order", command: "bee team list --order desc" },
    { description: "Output as JSON", command: "bee team list --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List teams",
    },
    args: {
      ...outputArgs,
      order: {
        type: "string",
        description: "Sort order",
        valueHint: "{asc|desc}",
      },
      offset: {
        type: "string",
        description: "Number of records to skip",
        valueHint: "<number>",
      },
      count: {
        type: "string",
        description: "Maximum number of records to return",
        valueHint: "<1-100>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const teams = await client.getTeams({
        order: args.order as "asc" | "desc" | undefined,
        offset: args.offset === undefined ? undefined : Number(args.offset),
        count: args.count === undefined ? undefined : Number(args.count),
      });

      outputResult(teams, args, (data) => {
        if (data.length === 0) {
          consola.info("No teams found.");
          return;
        }

        const rows: Row[] = data.map((t) => [
          { header: "ID", value: String(t.id) },
          { header: "NAME", value: t.name },
          { header: "MEMBERS", value: String(t.members.length) },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
