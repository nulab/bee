import { getClient } from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Mark all notifications as read.

This resets the unread notification count to zero.`,

  examples: [
    { description: "Mark all notifications as read", command: "bee notification read-all" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const readAll = withUsage(
  defineCommand({
    meta: {
      name: "read-all",
      description: "Mark all notifications as read",
    },
    args: {},
    async run() {
      const { client } = await getClient();

      await client.resetNotificationsMarkAsRead();

      consola.success("Marked all notifications as read.");
    },
  }),
  commandUsage,
);

export { commandUsage, readAll };
