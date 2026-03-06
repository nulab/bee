import { ROLE_LABELS, getClient } from "@repo/backlog-utils";
import { formatDate, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog user.

Shows user profile information including name, user ID, email address,
role, language, and last login time.

Use \`bee user me\` as a shortcut to view your own profile.`,

  examples: [
    { description: "View user details", command: "bee user view 12345" },
    { description: "Output as JSON", command: "bee user view 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a user",
    },
    args: {
      ...outputArgs,
      user: {
        type: "positional",
        description: "User ID",
        required: true,
        valueHint: "<number>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const userData = await client.getUser(Number(args.user));

      outputResult(userData, args, (data) => {
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

export { commandUsage, view };
