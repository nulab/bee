import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Create a new category in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.`,

  examples: [
    { description: "Create a category", command: 'bee category create -p PROJECT -n "Bug Report"' },
    { description: "Create interactively", command: "bee category create -p PROJECT" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create a category",
    },
    args: {
      ...outputArgs,
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "Category name",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const name = await promptRequired("Category name:", args.name);

      const category = await client.postCategories(args.project, { name });

      outputResult(category, args, (data) => {
        consola.success(`Created category ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
