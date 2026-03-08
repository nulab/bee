import {
  detectGitContext,
  getCurrentBranch,
  getLatestCommit,
  getRepoRelativePath,
  getClient,
  openOrPrintUrl,
} from "@repo/backlog-utils";
import { UserError } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../lib/bee-command";
import * as opt from "../lib/common-options";
import { resolveUrl } from "./browse-url";

const browse = new BeeCommand("browse")
  .summary("Open a Backlog page in the browser")
  .description(
    `Open a Backlog page in the browser.

With no arguments, the behavior depends on context. Inside a Backlog Git
repository it opens the repository page; otherwise it opens the dashboard.

When given an issue key (e.g. \`PROJECT-123\`), opens that issue. A bare
number like \`123\` is also accepted when the project can be inferred from
the Git remote. Use \`--project\` with section flags to navigate directly
to a specific project page.

A file path opens the file in the Backlog Git viewer (e.g. \`src/main.ts\`).
Append \`:<line>\` to jump to a specific line (e.g. \`src/main.ts:42\`).
Paths ending with \`/\` open the directory tree view.`,
  )
  .argument("[target]", "Issue key, issue number, file path, or project key")
  .addOption(opt.project().makeOptionMandatory(false).default(undefined))
  .option("-b, --branch <name>", "View file at a specific branch")
  .option("-c, --commit", "View file at the latest commit")
  .addOption(opt.noBrowser())
  .option("--issues", "Open the issues page")
  .option("--board", "Open the board page")
  .option("--gantt", "Open the Gantt chart page")
  .option("--wiki", "Open the wiki page")
  .option("--documents", "Open the documents page")
  .option("--files", "Open the shared files page")
  .option("--git", "Open the git repositories page")
  .option("--svn", "Open the Subversion page")
  .option("--settings", "Open the project settings page")
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Open repository page (in a Backlog repo)", command: "bee browse" },
    { description: "Open dashboard (outside a Backlog repo)", command: "bee browse" },
    { description: "Open an issue", command: "bee browse PROJECT-123" },
    { description: "Open issue by number (inferred project)", command: "bee browse 123" },
    { description: "Open a file in git viewer", command: "bee browse src/main.ts" },
    { description: "Open a file at a specific line", command: "bee browse src/main.ts:42" },
    { description: "Open a directory in git viewer", command: "bee browse src/" },
    { description: "Browse at a specific branch", command: "bee browse src/main.ts -b develop" },
    { description: "Browse at the latest commit", command: "bee browse -c" },
    { description: "Print URL without opening browser", command: "bee browse -n" },
    { description: "Open project issues page", command: "bee browse -p PROJECT --issues" },
    { description: "Open project board", command: "bee browse -p PROJECT --board" },
    { description: "Open Gantt chart", command: "bee browse -p PROJECT --gantt" },
  ])
  .action(async (target: string | undefined, opts) => {
    const { host } = await getClient();

    const [context, currentBranch, latestCommit, repoRelativePath] = await Promise.all([
      detectGitContext(),
      getCurrentBranch(),
      getLatestCommit(),
      getRepoRelativePath(),
    ]);

    const browseArgs = { target, ...opts };

    const result = resolveUrl(context?.host ?? host, browseArgs, {
      context,
      currentBranch,
      latestCommit,
      repoRelativePath,
    });

    if (!result.ok) {
      throw new UserError(result.error);
    }

    await openOrPrintUrl(result.url, opts.browser === false, consola);
  });

export default browse;
