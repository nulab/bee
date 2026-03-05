import { getClient } from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Mark a notification as read.

Specify the notification ID to mark as read. Use \`bee notification list\`
to find notification IDs.`,

  examples: [
    { description: "Mark a notification as read", command: "bee notification read 12345" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const read = withUsage(
  defineCommand({
    meta: {
      name: "read",
      description: "Mark a notification as read",
    },
    args: {
      id: {
        type: "positional",
        description: "Notification ID",
        required: true,
        valueHint: "<number>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      await client.markAsReadNotification(Number(args.id));

      consola.success(`Marked notification ${args.id} as read.`);
    },
  }),
  commandUsage,
);

export { commandUsage, read };
