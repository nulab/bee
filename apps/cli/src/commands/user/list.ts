import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List users")
  .description(
    `List all users in the Backlog space.

Displays each user's ID, user ID, name, and role. Only space administrators
can see the full list of users.`,
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List all users", command: "bee user list" },
    { description: "Output as JSON", command: "bee user list --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const users = await client.getUsers();

    outputResult(users, opts, (data) => {
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
  });

export default list;
