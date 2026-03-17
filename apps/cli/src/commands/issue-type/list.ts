import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const list = new BeeCommand("list")
  .summary("List issue types")
  .description(`Issue types categorize issues and are displayed with their associated color.`)
  .addOption(opt.project())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all issue types", command: "bee issue-type list -p PROJECT" },
    { description: "Output as JSON", command: "bee issue-type list -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const issueTypes = await client.getIssueTypes(opts.project);

    outputResult(issueTypes, opts, (data) => {
      if (data.length === 0) {
        consola.info("No issue types found.");
        return;
      }

      const rows: Row[] = data.map((t) => [
        { header: "ID", value: String(t.id) },
        { header: "NAME", value: t.name },
        { header: "COLOR", value: t.color },
      ]);

      printTable(rows);
    });
  });

export default list;
