import { getClient } from "@repo/backlog-utils";
import { type Row, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List repositories in a project")
  .description(
    `List Git repositories in a Backlog project.

By default, repositories are listed in the configured display order.`,
  )
  .argument("<project>", "Project ID or project key")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List repositories in a project", command: "bee repo list PROJECT_KEY" },
    { description: "Output as JSON", command: "bee repo list PROJECT_KEY --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const repos = await client.getGitRepositories(project);

    outputResult(repos, opts, (data) => {
      if (data.length === 0) {
        consola.info("No repositories found.");
        return;
      }

      const rows: Row[] = data.map((repo) => [
        { header: "NAME", value: repo.name },
        { header: "DESCRIPTION", value: repo.description ?? "" },
        { header: "LAST PUSHED", value: repo.pushedAt?.slice(0, 10) ?? "" },
      ]);

      printTable(rows);
    });
  });

export default list;
