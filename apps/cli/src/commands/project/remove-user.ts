import { getClient } from "@repo/backlog-utils";
import { UserError, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { RequiredOption, resolveOptions } from "../../lib/required-option";

const removeUser = new BeeCommand("remove-user")
  .summary("Remove a user from a project")
  .description(`Use \`bee project users\` to look up user IDs.`)
  .addOption(opt.project())
  .addOption(new RequiredOption("--user-id <id>", "User ID"))
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Remove a user from a project",
      command: "bee project remove-user -p PROJECT_KEY --user-id 12345",
    },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);

    const userId = Number(opts.userId);
    if (Number.isNaN(userId)) {
      throw new UserError("User ID must be a number.");
    }

    const { client } = await getClient();

    const user = await client.deleteProjectUsers(opts.project, { userId });

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(user, { ...opts, json: jsonArg }, (data) => {
      consola.success(`Removed user ${data.name} from project ${opts.project}.`);
    });
  });

export default removeUser;
