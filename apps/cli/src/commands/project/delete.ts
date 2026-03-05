import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Delete a Backlog project.

This action is irreversible. You will be prompted for confirmation unless
the --yes flag is provided.

Requires Administrator role.`,

  examples: [
    {
      description: "Delete a project (with confirmation)",
      command: "bee project delete PROJECT_KEY",
    },
    {
      description: "Delete a project without confirmation",
      command: "bee project delete PROJECT_KEY --yes",
    },
  ],

  annotations: {
    environment: [["BACKLOG_PROJECT", "Default project ID or project key"]],
  },
};

const deleteProject = withUsage(
  defineCommand({
    meta: {
      name: "delete",
      description: "Delete a project",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
      yes: {
        type: "boolean",
        alias: "y",
        description: "Skip confirmation prompt",
      },
    },
    async run({ args }) {
      const confirmed = await confirmOrExit(
        `Are you sure you want to delete project ${args.project}? This cannot be undone.`,
        args.yes,
      );

      if (!confirmed) {
        return;
      }

      const { client } = await getClient();

      const project = await client.deleteProject(args.project);

      outputResult(project, args, (data) => {
        consola.success(`Deleted project ${data.projectKey}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, deleteProject };
