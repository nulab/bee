import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Update an existing category in a Backlog project.

Renames the specified category.`,

  examples: [
    {
      description: "Rename a category",
      command: 'bee category edit 12345 -p PROJECT -n "New Name"',
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
      description: "Edit a category",
    },
    args: {
      ...outputArgs,
      category: {
        type: "positional",
        description: "Category ID",
        required: true,
        valueHint: "<number>",
      },
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "New name of the category",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const name = await promptRequired("Category name:", args.name);

      const category = await client.patchCategories(args.project, Number(args.category), { name });

      outputResult(category, args, (data) => {
        consola.success(`Updated category ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
