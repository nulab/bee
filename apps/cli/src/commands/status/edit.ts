import { getClient } from "@repo/backlog-utils";
import { outputResult, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit a status")
  .description(`Only specified fields are updated; others remain unchanged.`)
  .argument("<status>", "Status ID")
  .addOption(opt.project())
  .option("-n, --name <value>", "New name of the status")
  .option(
    "--color <value>",
    "Change display color {#ea2c00|#e87758|#e07b9a|#868cb7|#3b9dbd|#4caf93|#b0be3c|#eda62a|#f42858|#393939}",
  )
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Rename a status",
      command: 'bee status edit 12345 -p PROJECT -n "New Name"',
    },
    {
      description: "Change status color",
      command: 'bee status edit 12345 -p PROJECT --color "#e30000"',
    },
  ])
  .action(async (status, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const result = await client.patchProjectStatus(opts.project, v.parse(vInteger, status), {
      name: opts.name,
      color: opts.color as never,
    });

    outputResult(result, opts, (data) => {
      consola.success(`Updated status ${data.name} (ID: ${data.id})`);
    });
  });

export default edit;
