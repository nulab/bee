import { getClient } from "@repo/backlog-utils";
import { type Row, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List projects accessible to the authenticated user.

By default, only active (non-archived) projects are shown. Use --archived to
include archived projects, or omit the flag to show all projects regardless of
archive status.

Administrators can use --all to list every project in the space, not just the
ones they have joined.`,

  examples: [
    { description: "List your active projects", command: "bee project list" },
    { description: "Include archived projects", command: "bee project list --archived" },
    { description: "List all projects (admin only)", command: "bee project list --all" },
    { description: "Output as JSON", command: "bee project list --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const list = withUsage(
  defineCommand({
    meta: {
      name: "list",
      description: "List projects",
    },
    args: {
      ...outputArgs,
      archived: {
        type: "boolean",
        description: "Include archived projects. Omit to show all projects.",
      },
      all: {
        type: "boolean",
        description: "Include all projects (admin only)",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const projects = await client.getProjects({
        archived: args.archived,
        all: args.all,
      });

      outputResult(projects, args, (data) => {
        if (data.length === 0) {
          consola.info("No projects found.");
          return;
        }

        const rows: Row[] = data.map((project) => [
          { header: "KEY", value: project.projectKey },
          { header: "NAME", value: project.name },
          { header: "STATUS", value: project.archived ? "Archived" : "Active" },
        ]);

        printTable(rows);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, list };
