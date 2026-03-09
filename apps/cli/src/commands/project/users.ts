import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const users = new BeeCommand("users")
  .summary("List project users")
  .description(
    `List members of a Backlog project.

Displays each user's ID, user ID, name, and role within the project.`,
  )
  .argument("<project>", "Project ID or project key")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List project members", command: "bee project users PROJECT_KEY" },
    { description: "Output as JSON", command: "bee project users PROJECT_KEY --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient(opts.space);

    const members = await client.getProjectUsers(project);

    const jsonArg = opts.json === true ? "" : opts.json;
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
