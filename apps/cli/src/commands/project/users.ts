import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const users = new BeeCommand("users")
  .summary("List project users")
  .description(
    `List members of a Backlog project.

Displays each user's ID, user ID, name, and role within the project.`,
  )
  .addOption(opt.project())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List project members", command: "bee project users -p PROJECT_KEY" },
    { description: "Output as JSON", command: "bee project users -p PROJECT_KEY --json" },
  ])
  .action(async (_opts, cmd) => {
    const opts = await resolveOptions(cmd);

    const { client } = await getClient();

    const members = await client.getProjectUsers(opts.project as string);

    const jsonArg = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(members, { ...opts, json: jsonArg }, (data) => {
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
  });

export default users;
