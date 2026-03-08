import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List issue types")
  .description(
    `List issue types in a Backlog project.

Issue types categorize issues and are displayed with their associated color.`,
  )
  .argument("[project]", "Project ID or project key")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List all issue types", command: "bee issue-type list PROJECT" },
    { description: "Output as JSON", command: "bee issue-type list PROJECT --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const issueTypes = await client.getIssueTypes(project);

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
