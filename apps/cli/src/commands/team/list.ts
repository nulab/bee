import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

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
      order: commonArgs.order,
      offset: commonArgs.offset,
      count: commonArgs.count,
    },
    async run({ args }) {
      const { client } = await getClient();

      const order = v.parse(v.optional(v.picklist(["asc", "desc"])), args.order);
      const offset = v.parse(v.optional(v.pipe(v.string(), v.transform(Number))), args.offset);
      const count = v.parse(v.optional(v.pipe(v.string(), v.transform(Number))), args.count);

      const teams = await client.getTeams({ order, offset, count });

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
