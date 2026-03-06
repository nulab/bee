import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display details of the authenticated user.

This is a shortcut for \`bee user view\` that automatically looks up the
currently authenticated user. Shows the same profile information: name,
user ID, email address, role, language, and last login time.`,

  examples: [
    { description: "View your own profile", command: "bee user me" },
    { description: "Output as JSON", command: "bee user me --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const me = withUsage(
  defineCommand({
    meta: {
      name: "me",
      description: "View the authenticated user",
    },
    args: {
      ...outputArgs,
    },
    async run({ args }) {
      const { client } = await getClient();

      const myself = await client.getMyself();

      outputResult(myself, args, (data) => {
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
    },
  }),
  commandUsage,
);

export { commandUsage, me };
