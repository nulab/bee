import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const parseBooleanFlag = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return value !== "false";
};

const commandUsage: CommandUsage = {
  long: `Display the count of notifications for the authenticated user.

By default, returns the count of all notifications regardless of read status.
Use \`--already-read\` and \`--resource-already-read\` to filter by read status.`,

  examples: [
    { description: "Count all notifications", command: "bee notification count" },
    {
      description: "Count only unread notifications",
      command: "bee notification count --already-read false",
    },
    {
      description: "Count only read notifications",
      command: "bee notification count --already-read true",
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
        type: "string",
        description:
          "Filter by read status. If true, count only read notifications. If false, count only unread notifications. If omitted, count all.",
        valueHint: "{true|false}",
      },
      "resource-already-read": {
        type: "string",
        description:
          "Filter by resource read status. If true, count only notifications whose resource is already read. If false, count only notifications whose resource is not yet read. If omitted, count all.",
        valueHint: "{true|false}",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const alreadyRead = parseBooleanFlag(args["already-read"]);
      const resourceAlreadyRead = parseBooleanFlag(args["resource-already-read"]);

      const params: Record<string, boolean> = {};
      if (alreadyRead !== undefined) {
        params.alreadyRead = alreadyRead;
      }
      if (resourceAlreadyRead !== undefined) {
        params.resourceAlreadyRead = resourceAlreadyRead;
      }

      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- backlog-js types require both fields but API accepts partial params
      const result = await client.getNotificationsCount(
        params as unknown as Parameters<typeof client.getNotificationsCount>[0],
      );

      outputResult(result, args, (data) => {
        consola.log(String(data.count));
      });
    },
  }),
  commandUsage,
);

export { commandUsage, count };
