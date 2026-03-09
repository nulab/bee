import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const me = new BeeCommand("me")
  .summary("View the authenticated user")
  .description(
    `Display details of the authenticated user.

This is a shortcut for \`bee user view\` that automatically looks up the
currently authenticated user. Shows the same profile information: name,
user ID, email address, role, language, and last login time.`,
  )
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View your own profile", command: "bee user me" },
    { description: "Output as JSON", command: "bee user me --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient(opts.space);

    const myself = await client.getMyself();

    outputResult(myself, opts, (data) => {
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

export default me;
