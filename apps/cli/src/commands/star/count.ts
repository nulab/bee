import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Count stars received by a user.

If no user ID is specified, counts stars for the authenticated user. Use
\`--since\` and \`--until\` to filter by date range.`,

  examples: [
    { description: "Count your stars", command: "bee star count" },
    { description: "Count stars for a specific user", command: "bee star count 12345" },
    {
      description: "Count stars in a date range",
      command: "bee star count --since 2025-01-01 --until 2025-12-31",
    },
    { description: "Output as JSON", command: "bee star count --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const count = withUsage(
  defineCommand({
    meta: {
      name: "count",
      description: "Count received stars",
    },
    args: {
      ...outputArgs,
      user: {
        type: "positional",
        description: "User ID",
        required: false,
        valueHint: "<number>",
      },
      since: {
        type: "string",
        description: "Count stars received on or after this date",
        valueHint: "<yyyy-MM-dd>",
      },
      until: {
        type: "string",
        description: "Count stars received on or before this date",
        valueHint: "<yyyy-MM-dd>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      let userId: number;
      if (args.user) {
        userId = Number(args.user);
      } else {
        const myself = await client.getMyself();
        userId = myself.id;
      }

      const params: { since?: string; until?: string } = {};
      if (args.since) {
        params.since = args.since;
      }
      if (args.until) {
        params.until = args.until;
      }

      const result = await client.getUserStarsCount(userId, params);

      outputResult(result, args, (data) => {
        consola.log(String(data.count));
      });
    },
  }),
  commandUsage,
);

export { commandUsage, count };
