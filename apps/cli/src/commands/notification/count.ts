import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display the count of notifications for the authenticated user.

By default, returns the count of unread notifications. Use
\`--already-read\` and \`--resource-already-read\` flags to filter
which notifications are counted.`,

  examples: [
    { description: "Count unread notifications", command: "bee notification count" },
    {
      description: "Count including already-read notifications",
      command: "bee notification count --already-read",
    },
    { description: "Output as JSON", command: "bee notification count --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const count = withUsage(
  defineCommand({
    meta: {
      name: "count",
      description: "Count notifications",
    },
    args: {
      ...outputArgs,
      "already-read": {
        type: "boolean",
        description: "Include already-read notifications",
      },
      "resource-already-read": {
        type: "boolean",
        description: "Include notifications whose resource is already read",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const result = await client.getNotificationsCount({
        alreadyRead: args["already-read"] ?? false,
        resourceAlreadyRead: args["resource-already-read"] ?? false,
      });

      outputResult(result, args, (data) => {
        consola.log(String(data.count));
      });
    },
  }),
  commandUsage,
);

export { commandUsage, count };
