import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List categories in a Backlog project.

Categories help organize issues by grouping them into logical areas.`,

  examples: [
    { description: "List all categories in a project", command: "bee category list PROJECT" },
    { description: "Output as JSON", command: "bee category list PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List categories",
    },
    args: {
      ...outputArgs,
      project: commonArgs.projectPositional,
    },
    async run({ args }) {
      const { client } = await getClient();

      const categories = await client.getCategories(args.project);

      outputResult(categories, args, (data) => {
        if (data.length === 0) {
          consola.info("No categories found.");
          return;
        }

        const rows: Row[] = data.map((c) => [
          { header: "ID", value: String(c.id) },
          { header: "NAME", value: c.name },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
