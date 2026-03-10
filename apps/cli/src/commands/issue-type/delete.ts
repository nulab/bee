import { getClient } from "@repo/backlog-utils";
import { confirmOrExit, outputResult, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const deleteIssueType = new BeeCommand("delete")
  .summary("Delete an issue type")
  .description(
    `All issues of this type are reassigned to the substitute issue type. This action is irreversible.`,
  )
  .argument("<issueType>", "Issue type ID")
  .addOption(opt.project())
  .requiredOption(
    "--substitute-issue-type-id <value>",
    "Replacement issue type ID for affected issues",
  )
  .option("-y, --yes", "Skip confirmation prompt")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Delete an issue type",
      command: "bee issue-type delete 12345 -p PROJECT --substitute-issue-type-id 67890",
    },
    {
      description: "Delete without confirmation",
      command: "bee issue-type delete 12345 -p PROJECT --substitute-issue-type-id 67890 --yes",
    },
  ])
  .action(async (issueType, opts, cmd) => {
    await resolveOptions(cmd);
    const confirmed = await confirmOrExit(
      `Are you sure you want to delete issue type ${issueType}? This cannot be undone.`,
      opts.yes,
    );

    if (!confirmed) {
      return;
    }

    const { client } = await getClient(opts.space);

    const result = await client.deleteIssueType(opts.project, v.parse(vInteger, issueType), {
      substituteIssueTypeId: v.parse(vInteger, opts.substituteIssueTypeId),
    });

    outputResult(result, opts, (data) => {
      consola.success(`Deleted issue type ${data.name} (ID: ${data.id})`);
    });
  });

export default deleteIssueType;
