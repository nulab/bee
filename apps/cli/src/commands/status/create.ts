import { getClient } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const create = new BeeCommand("create")
  .summary("Create a status")
  .description(
    `Create a new status in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.
The \`--color\` flag must be one of the predefined Backlog colors.`,
  )
  .addOption(opt.project())
  .option("-n, --name <value>", "Status name")
  .requiredOption(
    "--color <value>",
    "Display color {#ea2c00|#e87758|#e07b9a|#868cb7|#3b9dbd|#4caf93|#b0be3c|#eda62a|#f42858|#393939}",
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Create a status",
      command: 'bee status create -p PROJECT -n "In Review" --color "#3b9dbd"',
    },
    {
      description: "Create interactively",
      command: 'bee status create -p PROJECT --color "#3b9dbd"',
    },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const name = await promptRequired("Status name:", opts.name);

    const status = await client.postProjectStatus(opts.project, {
      name,
      color: opts.color as never,
    });

    outputResult(status, opts, (data) => {
      consola.success(`Created status ${data.name} (ID: ${data.id})`);
    });
  });

export default create;
