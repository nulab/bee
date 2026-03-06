import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List all users in the Backlog space.

Displays each user's ID, user ID, name, and role. Only space administrators
can see the full list of users.`,

  examples: [
    { description: "List all users", command: "bee user list" },
    { description: "Output as JSON", command: "bee user list --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List users",
    },
    args: {
      ...outputArgs,
    },
    async run({ args }) {
      const { client } = await getClient();

      const users = await client.getUsers();

      outputResult(users, args, (data) => {
        if (data.length === 0) {
          consola.info("No users found.");
          return;
        }

        const rows: Row[] = data.map((u) => [
          { header: "ID", value: String(u.id) },
          { header: "USER ID", value: u.userId ?? "" },
          { header: "NAME", value: u.name },
          { header: "ROLE", value: ROLE_LABELS[u.roleType] ?? `Unknown (${u.roleType})` },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
