import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List projects")
  .description(
    `List projects accessible to the authenticated user.

By default, only active (non-archived) projects are shown. Use \`--archived\`
to include archived projects.

Administrators can use \`--all\` to list every project in the space, not just
the ones they have joined.`,
  )
  .option("--archived", "Include archived projects")
  .option("--all", "Include all projects (admin only)")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List your active projects", command: "bee project list" },
    { description: "Include archived projects", command: "bee project list --archived" },
    { description: "List all projects (admin only)", command: "bee project list --all" },
    { description: "Output as JSON", command: "bee project list --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient(opts.space);

    const projects = await client.getProjects({
      archived: opts.archived,
      all: opts.all,
    });

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(projects, { ...opts, json: jsonArg }, (data) => {
      if (data.length === 0) {
        consola.info("No projects found.");
        return;
      }

      const rows: Row[] = data.map((project) => [
        { header: "KEY", value: project.projectKey },
        { header: "NAME", value: project.name },
        { header: "STATUS", value: project.archived ? "Archived" : "Active" },
      ]);

      printTable(rows);
    });
  });

export default list;
