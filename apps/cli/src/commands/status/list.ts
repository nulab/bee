import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List statuses in a Backlog project.

Statuses define the workflow states that issues can move through.
Each status is displayed with its associated color.`,

  examples: [
    { description: "List all statuses", command: "bee status list PROJECT" },
    { description: "Output as JSON", command: "bee status list PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List statuses",
    },
    args: {
      ...outputArgs,
      project: commonArgs.projectPositional,
    },
    async run({ args }) {
      const { client } = await getClient();

      const statuses = await client.getProjectStatuses(args.project);

      outputResult(statuses, args, (data) => {
        if (data.length === 0) {
          consola.info("No statuses found.");
          return;
        }

        const rows: Row[] = data.map((s) => [
          { header: "ID", value: String(s.id) },
          { header: "NAME", value: s.name },
          { header: "COLOR", value: s.color },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
