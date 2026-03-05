import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Create a new Backlog project.

Project key must consist of uppercase letters (A\u2013Z), numbers (0\u20139), and
underscores (\`_\`). If \`--name\` or \`--key\` is not provided, you will be
prompted interactively.`,

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

  annotations: {
    environment: [...ENV_AUTH],
  },
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
        description: "Formatting rules",
        valueHint: "{backlog|markdown}",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const key = await promptRequired("Project key:", args.key);
      const name = await promptRequired("Project name:", args.name);

      const project = await client.postProject({
        key,
        name,
        chartEnabled: args["chart-enabled"],
        subtaskingEnabled: args["subtasking-enabled"],
        projectLeaderCanEditProjectLeader: args["project-leader-can-edit-project-leader"],
        textFormattingRule: (args["text-formatting-rule"] ?? "markdown") as "backlog" | "markdown",
      });

      outputResult(project, args, (data) => {
        consola.success(`Created project ${data.projectKey}: ${data.name}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
