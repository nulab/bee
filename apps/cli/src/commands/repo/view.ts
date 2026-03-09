import { getClient, openOrPrintUrl, repositoryUrl } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const view = new BeeCommand("view")
  .summary("View a repository")
  .description(
    `Display details of a Git repository in a Backlog project.

Shows repository name, description, HTTP and SSH clone URLs, size,
creation and update timestamps.

Use \`--web\` to open the repository in your default browser instead.`,
  )
  .argument("<repository>", "Repository name or ID")
  .addOption(opt.project())
  .addOption(opt.web("repository"))
  .addOption(opt.noBrowser())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "View repository details",
      command: "bee repo view api-server -p PROJECT_KEY",
    },
    {
      description: "Open repository in browser",
      command: "bee repo view api-server -p PROJECT_KEY --web",
    },
    { description: "Output as JSON", command: "bee repo view api-server -p PROJECT_KEY --json" },
  ])
  .action(async (repository, opts, cmd) => {
    await resolveOptions(cmd);
    const { client, host } = await getClient(opts.space);

    if (opts.web || opts.browser === false) {
      const url = repositoryUrl(host, opts.project, repository);
      await openOrPrintUrl(url, opts.browser === false, consola);
      return;
    }

    const repo = await client.getGitRepository(opts.project, repository);

    outputResult(repo, opts, (data) => {
      consola.log("");
      consola.log(`  ${data.name}`);
      consola.log("");
      printDefinitionList([
        ["Description", data.description ?? ""],
        ["HTTP URL", data.httpUrl],
        ["SSH URL", data.sshUrl],
        ["Created", formatDate(data.created)],
        ["Updated", formatDate(data.updated)],
        ["Last Pushed", data.pushedAt ? formatDate(data.pushedAt) : ""],
      ]);
      consola.log("");
    });
  });

export default view;
