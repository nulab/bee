import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Delete a Backlog document.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,

  examples: [
    {
      description: "Delete a document (with confirmation)",
      command: "bee document delete 12345",
    },
    {
      description: "Delete a document without confirmation",
      command: "bee document delete 12345 --yes",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const deleteDocument = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete a document",
    },
    args: {
      ...outputArgs,
      document: {
        type: "positional",
        description: "Document ID",
        valueHint: "<number>",
        required: true,
      },
      yes: {
        type: "boolean",
        alias: "y",
        description: "Skip confirmation prompt",
      },
    },
    async run({ args }) {
      const confirmed = await confirmOrExit(
        `Are you sure you want to delete document ${args.document}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const doc = await client.deleteDocument(args.document);

      outputResult(doc, args, (data) => {
        consola.success(`Deleted document ${data.title} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteDocument };
