import { getClient } from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Remove a star.

Use \`bee star list\` to find star IDs.`,
  examples: [{ description: "Remove a star", command: "bee star remove 12345" }],
  annotations: { environment: [...ENV_AUTH] },
};

const remove = withUsage(
  defineCommand({
    meta: { name: "remove", description: "Remove a star" },
    args: {
      star: {
        type: "positional",
        description: "Star ID",
        valueHint: "<number>",
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();
      await client.removeStar(Number(args.star));
      consola.success(`Removed star ${args.star}.`);
    },
  }),
  commandUsage,
);

export { commandUsage, remove };
