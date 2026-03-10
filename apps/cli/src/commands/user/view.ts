import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const view = new BeeCommand("view")
  .summary("View a user")
  .description(`Use \`bee user me\` as a shortcut to view your own profile.`)
  .argument("<user>", "User ID")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View user details", command: "bee user view 12345" },
    { description: "Output as JSON", command: "bee user view 12345 --json" },
  ])
  .action(async (user, opts) => {
    const { client } = await getClient(opts.space);

    const userData = await client.getUser(v.parse(vInteger, user));

    outputResult(userData, opts, (data) => {
      consola.log("");
      consola.log(`  ${data.name}`);
      consola.log("");
      printDefinitionList([
        ["ID", String(data.id)],
        ["User ID", data.userId],
        ["Email", data.mailAddress],
        ["Role", ROLE_LABELS[data.roleType] ?? `Unknown (${data.roleType})`],
        ["Language", data.lang],
        ["Last Login", data.lastLoginTime ? formatDate(data.lastLoginTime) : undefined],
      ]);
      consola.log("");
    });
  });

export default view;
