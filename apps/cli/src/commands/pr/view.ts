import { getClient, openOrPrintUrl, pullRequestUrl } from "@repo/backlog-utils";
import { formatDate, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const view = new BeeCommand("view")
  .summary("View a pull request")
  .description(
    `Display details of a Backlog pull request.

Shows the pull request summary, status, assignee, base/head branches,
and description.

Use \`--web\` to open the pull request in your default browser instead.`,
  )
  .argument("<number>", "Pull request number")
  .addOption(opt.project())
  .addOption(opt.repo())
  .addOption(opt.web("pull request"))
  .addOption(opt.noBrowser())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    { description: "View pull request details", command: "bee pr view 42 -p PROJECT -R repo" },
    {
      description: "Open pull request in browser",
      command: "bee pr view 42 -p PROJECT -R repo --web",
    },
    { description: "Output as JSON", command: "bee pr view 42 -p PROJECT -R repo --json" },
  ])
  .action(async (number, _opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client, host } = await getClient();

    const prNumber = Number(number);

    if (opts.web || opts.browser === false) {
      const url = pullRequestUrl(host, opts.project as string, opts.repo as string, prNumber);
      await openOrPrintUrl(url, opts.browser === false, consola);
      return;
    }

    const pullRequest = await client.getPullRequest(
      opts.project as string,
      opts.repo as string,
      prNumber,
    );

    const json = opts.json === true ? "" : (opts.json as string | undefined);
    outputResult(pullRequest, { json }, (data) => {
      consola.log("");
      consola.log(`  #${data.number}: ${data.summary}`);
      consola.log("");
      printDefinitionList([
        ["Status", data.status.name],
        ["Base", data.base],
        ["Head", data.branch],
        ["Assignee", data.assignee?.name ?? "Unassigned"],
        ["Created by", data.createdUser?.name ?? "Unknown"],
        ["Created", formatDate(data.created)],
        ["Updated", formatDate(data.updated)],
        ["Merged at", data.mergeAt ? formatDate(data.mergeAt) : undefined],
        ["Closed at", data.closeAt ? formatDate(data.closeAt) : undefined],
      ]);

      if (data.description) {
        consola.log("");
        consola.log("  Description:");
        consola.log(
          data.description
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n"),
        );
      }

      consola.log("");
    });
  });

export default view;
