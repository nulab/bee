import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const deleteStatus = new BeeCommand("delete")
  .summary("Delete a status")
  .description(
    `Delete a status from a Backlog project.

When deleting a status, all issues with that status must be reassigned
to another status. Use \`--substitute-status-id\` to specify
the replacement.

This action is irreversible. You will be prompted for confirmation unless
\`--yes\` is provided.`,
  )
  .argument("<status>", "Status ID")
  .addOption(opt.project())
  .requiredOption("--substitute-status-id <value>", "Replacement status ID for affected issues")
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Delete a status",
      command: "bee status delete 12345 -p PROJECT --substitute-status-id 67890",
    },
    {
      description: "Delete without confirmation",
      command: "bee status delete 12345 -p PROJECT --substitute-status-id 67890 --yes",
    },
  ])
  .action(async (status, opts, cmd) => {
    await resolveOptions(cmd);
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete status ${status}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const result = await client.deleteProjectStatus(
      opts.project,
      Number(status),
      Number(opts.substituteStatusId),
    );

    outputResult(result, opts, (data) => {
      consola.success(`Deleted status ${data.name} (ID: ${data.id})`);
    });
  });

export default deleteStatus;
