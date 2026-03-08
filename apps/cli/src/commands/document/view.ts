import { documentUrl, getClient, openOrPrintUrl } from "@repo/backlog-utils";
import {
  UserError,
  formatDate,
  outputArgs,
  outputResult,
  printDefinitionList,
} from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Display details of a Backlog document.

Shows the document title, metadata, and body content.

Use \`--web\` to open the document in your default browser instead. The
\`--project\` flag is required when using \`--web\`.`,

  examples: [
    { description: "View document details", command: "bee document view 12345" },
    {
      description: "Open document in browser",
      command: "bee document view 12345 --web -p PROJECT",
    },
    { description: "Output as JSON", command: "bee document view 12345 --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const view = withUsage(
  defineCommand({
    meta: {
      name: "view",
      description: "View a document",
    },
    args: {
      ...outputArgs,
      document: {
        type: "positional",
        description: "Document ID",
        valueHint: "<number>",
        required: true,
      },
      project: {
        ...commonArgs.project,
        description: "Project ID or project key (required for --web)",
      },
      web: commonArgs.web("document"),
      "no-browser": commonArgs.noBrowser,
    },
    async run({ args }) {
      const { client, host } = await getClient();

      if (args.web || args["no-browser"]) {
        if (!args.project) {
          throw new UserError("The --project flag is required when using --web.");
        }
        const url = documentUrl(host, args.project, args.document);
        await openOrPrintUrl(url, Boolean(args["no-browser"]), consola);
        return;
      }

      const doc = await client.getDocument(args.document);

      outputResult(doc, args, (data) => {
        consola.log("");
        consola.log(`  ${data.title}`);
        consola.log("");
        printDefinitionList([
          ["ID", data.id],
          ["Emoji", data.emoji ?? undefined],
          ["Tags", data.tags.length > 0 ? data.tags.map((t) => t.name).join(", ") : undefined],
          ["Created by", data.createdUser?.name ?? "Unknown"],
          ["Created", formatDate(data.created)],
          ["Updated by", data.updatedUser?.name ?? "Unknown"],
          ["Updated", formatDate(data.updated)],
        ]);

        if (data.plain) {
          consola.log("");
          consola.log("  Body:");
          consola.log(
            data.plain
              .split("\n")
              .map((line) => `    ${line}`)
              .join("\n"),
          );
        }

        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, view };
