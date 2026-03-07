import {
  type GitContext,
  buildBacklogUrl,
  dashboardUrl,
  detectGitContext,
  getCurrentBranch,
  getLatestCommit,
  getRepoRelativePath,
  getClient,
  gitBlobUrl,
  gitCommitUrl,
  gitTreeUrl,
  issueUrl,
  openUrl,
  projectUrl,
  repositoryUrl,
} from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../lib/command-usage";
import * as commonArgs from "../lib/common-args";

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

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9_]+-\d+$/;
const ISSUE_NUMBER_PATTERN = /^\d+$/;
const FILE_LINE_PATTERN = /^(.+):(\d+)$/;

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
      "no-browser": {
        type: "boolean",
        alias: "n",
        description: "Print the URL instead of opening the browser",
      },
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
      const gitContext = await detectGitContext();

      const url = await resolveUrl(host, args, gitContext);

      if (args["no-browser"]) {
        consola.log(url);
        return;
      }

      await openUrl(url);
      consola.info(`Opening ${url} in your browser.`);
    },
  }),
  commandUsage,
);

type BrowseArgs = {
  target?: string;
  project?: string;
  branch?: string;
  commit?: boolean;
  issues?: boolean;
  board?: boolean;
  gantt?: boolean;
  wiki?: boolean;
  documents?: boolean;
  files?: boolean;
  git?: boolean;
  svn?: boolean;
  settings?: boolean;
};

const resolveUrl = async (
  host: string,
  args: BrowseArgs,
  gitContext: GitContext | undefined,
): Promise<string> => {
  // Issue key target takes priority (e.g. PROJECT-123)
  if (args.target && ISSUE_KEY_PATTERN.test(args.target)) {
    return issueUrl(host, args.target);
  }

  // Bare issue number (e.g. 123) — requires project from git context or --project
  if (args.target && ISSUE_NUMBER_PATTERN.test(args.target)) {
    const projectKey = args.project ?? gitContext?.projectKey;
    if (projectKey) {
      return issueUrl(host, `${projectKey}-${args.target}`);
    }
    consola.error(
      "Cannot resolve issue number without a project. Use --project or run inside a Backlog repository.",
    );
    process.exit(1);
  }

  // File/directory path target (contains / or . or ends with specific patterns)
  if (args.target && isFilePath(args.target)) {
    return resolveFileUrl(host, args, gitContext);
  }

  // Project section pages require --project or target
  const projectKey = args.target ?? args.project ?? gitContext?.projectKey;

  if (projectKey) {
    if (args.issues) {
      return buildBacklogUrl(host, `/find/${projectKey}`);
    }
    if (args.board) {
      return buildBacklogUrl(host, `/board/${projectKey}`);
    }
    if (args.gantt) {
      return buildBacklogUrl(host, `/gantt/${projectKey}`);
    }
    if (args.wiki) {
      return buildBacklogUrl(host, `/wiki/${projectKey}`);
    }
    if (args.documents) {
      return buildBacklogUrl(host, `/document/${projectKey}`);
    }
    if (args.files) {
      return buildBacklogUrl(host, `/file/${projectKey}`);
    }
    if (args.git) {
      return buildBacklogUrl(host, `/git/${projectKey}`);
    }
    if (args.svn) {
      return buildBacklogUrl(host, `/subversion/${projectKey}`);
    }
    if (args.settings) {
      return buildBacklogUrl(host, `/EditProject.action?project.id=${projectKey}`);
    }
  }

  // --branch or --commit without target opens the tree at that ref
  if (args.branch || args.commit) {
    return resolveFileUrl(host, args, gitContext);
  }

  // target is a project key (no section flag)
  if (args.target) {
    return projectUrl(host, args.target);
  }

  // No target: inside a Backlog repo → open repo page; otherwise → dashboard
  if (gitContext) {
    return repositoryUrl(host, gitContext.projectKey, gitContext.repoName);
  }

  return dashboardUrl(host);
};

const isFilePath = (target: string): boolean => {
  // Heuristic: contains path separators, file extensions, or line number suffix
  if (target.includes("/")) {
    return true;
  }
  if (FILE_LINE_PATTERN.test(target)) {
    return true;
  }
  if (target.includes(".") && !ISSUE_KEY_PATTERN.test(target)) {
    return true;
  }
  return false;
};

const resolveFileUrl = async (
  host: string,
  args: BrowseArgs,
  gitContext: GitContext | undefined,
): Promise<string> => {
  if (!gitContext) {
    consola.error("Not inside a Backlog Git repository. Cannot resolve file path.");
    process.exit(1);
  }

  let ref: string;
  if (args.commit) {
    const sha = await getLatestCommit();
    if (!sha) {
      consola.error("Could not determine the latest commit.");
      process.exit(1);
    }
    // For --commit without target, open the commit page directly
    if (!args.target) {
      return gitCommitUrl(host, gitContext.projectKey, gitContext.repoName, sha);
    }
    ref = sha;
  } else if (args.branch) {
    ref = args.branch;
  } else {
    const branch = await getCurrentBranch();
    ref = branch ?? "main";
  }

  // No target with --branch: open tree at branch root
  if (!args.target) {
    return gitTreeUrl(host, gitContext.projectKey, gitContext.repoName, ref);
  }

  // Parse line number from target (e.g. src/main.ts:42)
  const lineMatch = args.target.match(FILE_LINE_PATTERN);
  const filePath = lineMatch ? lineMatch[1] : args.target;
  const line = lineMatch ? Number(lineMatch[2]) : undefined;

  // Resolve repo-relative path
  const prefix = await getRepoRelativePath();
  const fullPath = prefix ? `${prefix}${filePath}` : filePath;
  // Normalize: remove trailing slash for blob, keep for tree
  const isDir = filePath.endsWith("/");

  if (isDir) {
    return gitTreeUrl(
      host,
      gitContext.projectKey,
      gitContext.repoName,
      ref,
      fullPath.replace(/\/$/, ""),
    );
  }

  return gitBlobUrl(host, gitContext.projectKey, gitContext.repoName, ref, fullPath, line);
};

export { commandUsage, browse };
