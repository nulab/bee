import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List stars received by a user.

If no user ID is specified, lists stars for the authenticated user.`,

  examples: [
    { description: "List your stars", command: "bee star list" },
    { description: "List stars for a specific user", command: "bee star list 12345" },
    { description: "Output as JSON", command: "bee star list --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List received stars",
    },
    args: {
      ...outputArgs,
      user: {
        type: "positional",
        description: "User ID",
        required: false,
        valueHint: "<number>",
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

      const stars = await client.getUserStars(userId, {});

      outputResult(stars, args, (data) => {
        if (data.length === 0) {
          consola.info("No stars found.");
          return;
        }

        const rows: Row[] = data.map((s) => [
          { header: "ID", value: String(s.id) },
          { header: "TITLE", value: s.title },
          { header: "PRESENTER", value: s.presenter.name },
          { header: "DATE", value: formatDate(s.created) },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
