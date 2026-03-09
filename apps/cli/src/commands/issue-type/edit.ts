import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const edit = new BeeCommand("edit")
  .summary("Edit an issue type")
  .description(
    `Update an existing issue type in a Backlog project.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,
  )
  .argument("<issueType>", "Issue type ID")
  .addOption(opt.project())
  .option("-n, --name <value>", "New name of the issue type")
  .option(
    "--color <value>",
    "Change display color {#e30000|#990000|#934981|#814fbc|#2779ca|#007e9a|#7ea800|#ff9200|#ff3265|#666665}",
  )
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Rename an issue type",
      command: 'bee issue-type edit 12345 -p PROJECT -n "New Name"',
    },
    {
      description: "Change issue type color",
      command: 'bee issue-type edit 12345 -p PROJECT --color "#e30000"',
    },
  ])
  .action(async (issueType, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const result = await client.patchIssueType(opts.project, Number(issueType), {
      name: opts.name,
      color: opts.color as never,
    });

    outputResult(result, opts, (data) => {
      consola.success(`Updated issue type ${data.name} (ID: ${data.id})`);
    });
  });

export default edit;
