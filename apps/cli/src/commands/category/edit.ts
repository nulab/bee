import { getClient } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit a category")
  .description(
    `Update an existing category in a Backlog project.

Renames the specified category.`,
  )
  .argument("<category>", "Category ID")
  .addOption(opt.project())
  .option("-n, --name <value>", "New name of the category")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Rename a category",
      command: 'bee category edit 12345 -p PROJECT -n "New Name"',
    },
  ])
  .action(async (category, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const name = await promptRequired("Category name:", opts.name);

    const result = await client.patchCategories(opts.project, Number(category), { name });

    outputResult(result, opts, (data) => {
      consola.success(`Updated category ${data.name} (ID: ${data.id})`);
    });
  });

export default edit;
