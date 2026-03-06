import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Create a new status in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.
The \`--color\` flag must be one of the predefined Backlog colors.`,

  examples: [
    {
      description: "Create a status",
      command: 'bee status create -p PROJECT -n "In Review" --color "#3b9dbd"',
    },
    {
      description: "Create interactively",
      command: 'bee status create -p PROJECT --color "#3b9dbd"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create a status",
    },
    args: {
      ...outputArgs,
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "Status name",
      },
      color: {
        type: "string",
        description: "Display color",
        valueHint:
          "{#ea2c00|#e87758|#e07b9a|#868cb7|#3b9dbd|#4caf93|#b0be3c|#eda62a|#f42858|#393939}",
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const name = await promptRequired("Status name:", args.name);

      const status = await client.postProjectStatus(args.project, {
        name,
        color: args.color as never,
      });

      outputResult(status, args, (data) => {
        consola.success(`Created status ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
