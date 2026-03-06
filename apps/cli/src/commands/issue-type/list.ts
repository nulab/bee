import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List issue types in a Backlog project.

Issue types categorize issues and are displayed with their associated color.`,

  examples: [
    { description: "List all issue types", command: "bee issue-type list PROJECT" },
    { description: "Output as JSON", command: "bee issue-type list PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List issue types",
    },
    args: {
      ...outputArgs,
      project: commonArgs.projectPositional,
    },
    async run({ args }) {
      const { client } = await getClient();

      const issueTypes = await client.getIssueTypes(args.project);

      outputResult(issueTypes, args, (data) => {
        if (data.length === 0) {
          consola.info("No issue types found.");
          return;
        }

        const rows: Row[] = data.map((t) => [
          { header: "ID", value: String(t.id) },
          { header: "NAME", value: t.name },
          { header: "COLOR", value: t.color },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
