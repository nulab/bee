import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Update an existing Backlog project.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,

  examples: [
    {
      description: "Rename a project",
      command: 'bee project edit PROJECT_KEY --name "New Name"',
    },
    {
      description: "Archive a project",
      command: "bee project edit PROJECT_KEY --archived",
    },
    {
      description: "Change formatting rule to markdown",
      command: "bee project edit PROJECT_KEY --text-formatting-rule markdown",
    },
  ],

  annotations: {
    environment: [["BACKLOG_PROJECT", "Default project ID or project key"]],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit a project",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
      name: {
        type: "string",
        alias: "n",
        description: "New name of the project",
      },
      key: {
        type: "string",
        alias: "k",
        description: "New key of the project",
      },
      "chart-enabled": {
        type: "boolean",
        description: "Change whether the chart is enabled",
      },
      "subtasking-enabled": {
        type: "boolean",
        description: "Change whether subtasking is enabled",
      },
      "project-leader-can-edit-project-leader": {
        type: "boolean",
        description: "Change whether project administrators can manage each other",
      },
      "text-formatting-rule": {
        type: "string",
        description: "Change text formatting rule",
        valueHint: "{backlog|markdown}",
      },
      archived: {
        type: "boolean",
        description: "Change whether the project is archived",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const project = await client.patchProject(args.project, {
        name: args.name,
        key: args.key,
        chartEnabled: args["chart-enabled"],
        subtaskingEnabled: args["subtasking-enabled"],
        projectLeaderCanEditProjectLeader: args["project-leader-can-edit-project-leader"],
        textFormattingRule: args["text-formatting-rule"] as "backlog" | "markdown" | undefined,
        archived: args.archived,
      });

      outputResult(project, args, (data) => {
        consola.success(`Updated project ${data.projectKey}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
