import { getClient } from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Mark a watching item as read.

Specify the watching ID to mark as read. Use \`bee watching list\`
to find watching IDs.`,

  examples: [{ description: "Mark a watching item as read", command: "bee watching read 12345" }],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const read = withUsage(
  defineCommand({
    meta: {
      name: "read",
      description: "Mark a watching item as read",
    },
    args: {
      watching: {
        type: "positional",
        description: "Watching ID",
        required: true,
        valueHint: "<number>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      await client.resetWatchingListItemAsRead(Number(args.watching));

      consola.success(`Marked watching ${args.watching} as read.`);
    },
  }),
  commandUsage,
);

export { commandUsage, read };
