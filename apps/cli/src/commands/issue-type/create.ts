import { getClient } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const create = new BeeCommand("create")
  .summary("Create an issue type")
  .description(
    `Create a new issue type in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.
The \`--color\` flag must be one of the predefined Backlog colors.`,
  )
  .addOption(opt.project())
  .option("-n, --name <value>", "Issue type name")
  .requiredOption(
    "--color <value>",
    "Display color {#e30000|#990000|#934981|#814fbc|#2779ca|#007e9a|#7ea800|#ff9200|#ff3265|#666665}",
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Create an issue type",
      command: 'bee issue-type create -p PROJECT -n "Enhancement" --color "#2779ca"',
    },
    {
      description: "Create interactively",
      command: 'bee issue-type create -p PROJECT --color "#2779ca"',
    },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const name = await promptRequired("Issue type name:", opts.name);

    const issueType = await client.postIssueType(opts.project, {
      name,
      color: opts.color as never,
    });

    outputResult(issueType, opts, (data) => {
      consola.success(`Created issue type ${data.name} (ID: ${data.id})`);
    });
  });

export default create;
