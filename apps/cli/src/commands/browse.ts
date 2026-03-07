import {
  detectGitContext,
  getCurrentBranch,
  getLatestCommit,
  getRepoRelativePath,
  getClient,
  openOrPrintUrl,
} from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../lib/command-usage";
import * as commonArgs from "../lib/common-args";
import { resolveUrl } from "./browse-url";

const commandUsage: CommandUsage = {
  long: `Open a Backlog page in the browser.

With no arguments, the behavior depends on context. Inside a Backlog Git
repository it opens the repository page; otherwise it opens the dashboard.

When given an issue key (e.g. \`PROJECT-123\`), opens that issue. A bare
number like \`123\` is also accepted when the project can be inferred from
the Git remote. Use \`--project\` with section flags to navigate directly
to a specific project page.

A file path opens the file in the Backlog Git viewer (e.g. \`src/main.ts\`).
Append \`:<line>\` to jump to a specific line (e.g. \`src/main.ts:42\`).
Paths ending with \`/\` open the directory tree view.`,

  examples: [
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
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const browse = withUsage(
  defineCommand({
    meta: {
      name: "browse",
      description: "Open a Backlog page in the browser",
    },
    args: {
      target: {
        type: "positional",
        description: "Issue key, issue number, file path, or project key",
        required: false,
        valueHint: "<PROJECT-123>",
      },
      project: commonArgs.project,
      branch: {
        type: "string",
        alias: "b",
        description: "View file at a specific branch",
      },
      commit: {
        type: "boolean",
        alias: "c",
        description: "View file at the latest commit",
      },
      "no-browser": commonArgs.noBrowser,
      issues: {
        type: "boolean",
        description: "Open the issues page",
      },
      board: {
        type: "boolean",
        description: "Open the board page",
      },
      gantt: {
        type: "boolean",
        description: "Open the Gantt chart page",
      },
      wiki: {
        type: "boolean",
        description: "Open the wiki page",
      },
      documents: {
        type: "boolean",
        description: "Open the documents page",
      },
      files: {
        type: "boolean",
        description: "Open the shared files page",
      },
      git: {
        type: "boolean",
        description: "Open the git repositories page",
      },
      svn: {
        type: "boolean",
        description: "Open the Subversion page",
      },
      settings: {
        type: "boolean",
        description: "Open the project settings page",
      },
    },
    async run({ args }) {
      const { host } = await getClient();

      const [context, currentBranch, latestCommit, repoRelativePath] = await Promise.all([
        detectGitContext(),
        getCurrentBranch(),
        getLatestCommit(),
        getRepoRelativePath(),
      ]);

      const result = resolveUrl(host, args, {
        context,
        currentBranch,
        latestCommit,
        repoRelativePath,
      });

      if (!result.ok) {
        consola.error(result.error);
        process.exit(1);
      }

      await openOrPrintUrl(result.url, Boolean(args["no-browser"]), consola);
    },
  }),
  commandUsage,
);

export { commandUsage, browse };
