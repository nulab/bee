import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const deleteCategory = new BeeCommand("delete")
  .summary("Delete a category")
  .description(
    `Delete a category from a Backlog project.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,
  )
  .argument("<category>", "Category ID")
  .addOption(opt.project())
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Delete a category (with confirmation)",
      command: "bee category delete 12345 -p PROJECT",
    },
    {
      description: "Delete without confirmation",
      command: "bee category delete 12345 -p PROJECT --yes",
    },
  ])
  .action(async (category, opts, cmd) => {
    await resolveOptions(cmd);
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete category ${category}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const result = await client.deleteCategories(opts.project, Number(category));

    outputResult(result, opts, (data) => {
      consola.success(`Deleted category ${data.name} (ID: ${data.id})`);
    });
  });

export default deleteCategory;
