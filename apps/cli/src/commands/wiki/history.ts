import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Display the revision history of a Backlog wiki page.

Shows version number, updater, and update date for each revision.`,

  examples: [
    { description: "View wiki page history", command: "bee wiki history 12345" },
    {
      description: "View history in ascending order",
      command: "bee wiki history 12345 --order asc",
    },
    { description: "Output as JSON", command: "bee wiki history 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const history = withUsage(
  defineCommand({
    meta: {
      name: "history",
      description: "View wiki page history",
    },
    args: {
      ...outputArgs,
      wiki: {
        type: "positional",
        description: "Wiki page ID",
        valueHint: "<number>",
        required: true,
      },
      "min-id": commonArgs.minId,
      "max-id": commonArgs.maxId,
      count: commonArgs.count,
      order: commonArgs.order,
    },
    async run({ args }) {
      const { client } = await getClient();

      const histories = await client.getWikisHistory(Number(args.wiki), {
        minId: args["min-id"] ? Number(args["min-id"]) : undefined,
        maxId: args["max-id"] ? Number(args["max-id"]) : undefined,
        count: args.count ? Number(args.count) : undefined,
        order: args.order as "asc" | "desc" | undefined,
      });

      outputResult(histories, args, (data) => {
        if (data.length === 0) {
          consola.info("No history found.");
          return;
        }

        const rows: Row[] = data.map(
          (h: { version: number; createdUser: { name: string }; created: string }) => [
            { header: "VERSION", value: String(h.version) },
            { header: "UPDATED BY", value: h.createdUser.name },
            { header: "UPDATED", value: formatDate(h.created) },
          ],
        );

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, history };
