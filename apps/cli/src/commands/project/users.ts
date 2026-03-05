import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";
import { ROLE_LABELS } from "../../lib/role-labels";

const commandUsage: CommandUsage = {
  long: `List members of a Backlog project.

Displays each user's ID, user ID, name, and role within the project.`,

  examples: [
    { description: "List project members", command: "bee project users PROJECT_KEY" },
    { description: "Output as JSON", command: "bee project users PROJECT_KEY --json" },
  ],

  annotations: {
    environment: [["BACKLOG_PROJECT", "Default project ID or project key"]],
  },
};

const users = withUsage(
  defineCommand({
    meta: {
      name: "users",
      description: "List project users",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const members = await client.getProjectUsers(args.project);

      outputResult(members, args, (data) => {
        if (data.length === 0) {
          consola.info("No users found.");
          return;
        }

        const rows: Row[] = data.map((user) => [
          { header: "ID", value: String(user.id) },
          { header: "USER ID", value: user.userId ?? "" },
          { header: "NAME", value: user.name },
          { header: "ROLE", value: ROLE_LABELS[user.roleType] ?? `Unknown (${user.roleType})` },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, users };
