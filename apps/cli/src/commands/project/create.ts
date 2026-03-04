import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { projectsCreate } from "@repo/openapi-client";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog project.

Project key must consist of uppercase letters (A-Z), numbers (0-9), and
underscores (_). If name or key is not provided via flags, you will be
prompted to enter them interactively.`,

  examples: [
    {
      description: "Create a project with key and name",
      command: 'bee project create --key TEST --name "Test Project"',
    },
    {
      description: "Create a project with markdown formatting",
      command:
        'bee project create --key TEST --name "Test Project" --text-formatting-rule markdown',
    },
    {
      description: "Create a project interactively",
      command: "bee project create",
    },
  ],
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create a project",
    },
    args: {
      ...outputArgs,
      key: {
        type: "string",
        alias: "k",
        description:
          "Project key. Uppercase letters (A-Z), numbers (0-9) and underscore (_) can be used.",
      },
      name: {
        type: "string",
        alias: "n",
        description: "Project name",
      },
      "chart-enabled": {
        type: "boolean",
        description: "Enable chart",
      },
      "subtasking-enabled": {
        type: "boolean",
        description: "Enable subtasking",
      },
      "project-leader-can-edit-project-leader": {
        type: "boolean",
        description: "Allow project administrators to manage each other",
      },
      "text-formatting-rule": {
        type: "string",
        description: "Formatting rules. {backlog|markdown}",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const key = await promptRequired("Project key:", args.key);
      const name = await promptRequired("Project name:", args.name);

      const { data: project } = await projectsCreate({
        client,
        throwOnError: true,
        body: {
          key,
          name,
          chartEnabled: args["chart-enabled"],
          subtaskingEnabled: args["subtasking-enabled"],
          projectLeaderCanEditProjectLeader: args["project-leader-can-edit-project-leader"],
          textFormattingRule: args["text-formatting-rule"] as "backlog" | "markdown" | undefined,
        },
      });

      outputResult(project, args, (data) => {
        consola.success(`Created project ${data.projectKey}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
