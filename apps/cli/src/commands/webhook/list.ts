import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `List webhooks in a Backlog project.

Webhooks allow external services to receive notifications when events occur
in a project.`,

  examples: [
    { description: "List all webhooks in a project", command: "bee webhook list -p PROJECT" },
    { description: "Output as JSON", command: "bee webhook list -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List webhooks",
    },
    args: {
      ...outputArgs,
      project: { ...commonArgs.project, required: true },
    },
    async run({ args }) {
      const { client } = await getClient();

      const webhooks = await client.getWebhooks(args.project);

      outputResult(webhooks, args, (data) => {
        if (data.length === 0) {
          consola.info("No webhooks found.");
          return;
        }

        const rows: Row[] = data.map(
          (w: { id: number; name: string; hookUrl: string; allEvent: boolean }) => [
            { header: "ID", value: String(w.id) },
            { header: "NAME", value: w.name },
            { header: "HOOK URL", value: w.hookUrl },
            { header: "ALL EVENT", value: w.allEvent ? "Yes" : "No" },
          ],
        );

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
