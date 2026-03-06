import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List milestones in a Backlog project.

Milestones (also known as versions) help track release schedules and
group issues by development cycle.`,

  examples: [
    { description: "List all milestones", command: "bee milestone list PROJECT" },
    { description: "Output as JSON", command: "bee milestone list PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List milestones",
    },
    args: {
      ...outputArgs,
      project: commonArgs.projectPositional,
    },
    async run({ args }) {
      const { client } = await getClient();

      const milestones = await client.getVersions(args.project);

      outputResult(milestones, args, (data) => {
        if (data.length === 0) {
          consola.info("No milestones found.");
          return;
        }

        const rows: Row[] = data.map((m) => [
          { header: "ID", value: String(m.id) },
          { header: "NAME", value: m.name },
          { header: "START DATE", value: m.startDate?.slice(0, 10) ?? "" },
          { header: "RELEASE DUE DATE", value: m.releaseDueDate?.slice(0, 10) ?? "" },
          { header: "ARCHIVED", value: m.archived ? "Yes" : "No" },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
