import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Add an issue to your watching list.

Subscribe to an issue to receive notifications when it is updated. Optionally
attach a note for your own reference.`,

  examples: [
    { description: "Watch an issue", command: "bee watching add --issue PROJECT-123" },
    {
      description: "Watch an issue with a note",
      command: 'bee watching add --issue PROJECT-123 --note "Track progress"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const add = withUsage(
  defineCommand({
    meta: {
      name: "add",
      description: "Add a watching item",
    },
    args: {
      ...outputArgs,
      issue: { ...commonArgs.issue, required: true },
      note: {
        type: "string",
        description: "Note to attach to the watching item",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const result = await client.postWatchingListItem({
        issueIdOrKey: args.issue,
        note: args.note ?? "",
      });

      outputResult(result, args, (data) => {
        consola.success(`Added watching for issue ${data.issue.issueKey} (ID: ${data.id}).`);
      });
    },
  }),
  commandUsage,
);

export { add, commandUsage };
