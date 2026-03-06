import { getClient } from "@repo/backlog-utils";
import {
  type Row,
  formatDate,
  outputArgs,
  outputResult,
  printTable,
  splitArg,
} from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";
import { resolveProjectIds } from "../../lib/resolve-project";

const commandUsage: CommandUsage = {
  long: `List documents from a Backlog project.

Use \`--sort\` to change the sort field and \`--keyword\` to search within
document titles and content.`,

  examples: [
    { description: "List documents in a project", command: "bee document list -p PROJECT" },
    {
      description: "Search documents by keyword",
      command: 'bee document list -p PROJECT -k "meeting notes"',
    },
    { description: "Output as JSON", command: "bee document list -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List documents",
    },
    args: {
      ...outputArgs,
      project: {
        ...commonArgs.project,
        description: "Project ID or project key (comma-separated for multiple)",
      },
      keyword: commonArgs.keyword,
      sort: {
        type: "string",
        description: "Sort field",
        valueHint: "{created|updated}",
      },
      order: commonArgs.order,
      count: commonArgs.count,
      offset: commonArgs.offset,
    },
    async run({ args }) {
      const { client } = await getClient();

      const projectId = await resolveProjectIds(client, splitArg(args.project, v.string()));

      const documents = await client.getDocuments({
        projectId,
        keyword: args.keyword,
        sort: args.sort as "created" | "updated" | undefined,
        order: args.order as "asc" | "desc" | undefined,
        count: args.count ? Number(args.count) : undefined,
        offset: args.offset ? Number(args.offset) : 0,
      });

      outputResult(documents, args, (data) => {
        if (data.length === 0) {
          consola.info("No documents found.");
          return;
        }

        const rows: Row[] = data.map((doc) => [
          { header: "ID", value: doc.id },
          { header: "EMOJI", value: doc.emoji ?? "" },
          { header: "TITLE", value: doc.title },
          { header: "UPDATED", value: formatDate(doc.updated) },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
