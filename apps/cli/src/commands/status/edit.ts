import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Update an existing status in a Backlog project.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,

  examples: [
    {
      description: "Rename a status",
      command: 'bee status edit 12345 -p PROJECT -n "New Name"',
    },
    {
      description: "Change status color",
      command: 'bee status edit 12345 -p PROJECT --color "#e30000"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit a status",
    },
    args: {
      ...outputArgs,
      status: {
        type: "positional",
        description: "Status ID",
        required: true,
        valueHint: "<number>",
      },
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "New name of the status",
      },
      color: {
        type: "string",
        description: "Change display color",
        valueHint:
          "{#ea2c00|#e87758|#e07b9a|#868cb7|#3b9dbd|#4caf93|#b0be3c|#eda62a|#f42858|#393939}",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const status = await client.patchProjectStatus(args.project, Number(args.status), {
        name: args.name,
        color: args.color as never,
      });

      outputResult(status, args, (data) => {
        consola.success(`Updated status ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
