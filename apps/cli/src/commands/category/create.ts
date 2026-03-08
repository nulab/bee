import { getClient } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const create = new BeeCommand("create")
  .summary("Create a category")
  .description(
    `Create a new category in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.`,
  )
  .addOption(opt.project())
  .option("-n, --name <value>", "Category name")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Create a category", command: 'bee category create -p PROJECT -n "Bug Report"' },
    { description: "Create interactively", command: "bee category create -p PROJECT" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const name = await promptRequired("Category name:", opts.name);

    const category = await client.postCategories(opts.project, { name });

    outputResult(category, opts, (data) => {
      consola.success(`Created category ${data.name} (ID: ${data.id})`);
    });
  });

export default create;
