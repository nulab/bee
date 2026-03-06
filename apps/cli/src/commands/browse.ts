import {
  buildBacklogUrl,
  dashboardUrl,
  getClient,
  issueUrl,
  openUrl,
  projectUrl,
} from "@repo/backlog-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../lib/command-usage";
import * as commonArgs from "../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Open a Backlog page in the browser.

With no arguments, opens the dashboard. When given an issue key (e.g.
\`PROJECT-123\`), opens that issue. Use \`--project\` with section flags
to navigate directly to a specific project page.`,

  examples: [
    { description: "Open dashboard", command: "bee browse" },
    { description: "Open an issue", command: "bee browse PROJECT-123" },
    { description: "Open project issues page", command: "bee browse -p PROJECT --issues" },
    { description: "Open project board", command: "bee browse -p PROJECT --board" },
    { description: "Open Gantt chart", command: "bee browse -p PROJECT --gantt" },
    { description: "Open project wiki", command: "bee browse -p PROJECT --wiki" },
    { description: "Open project documents", command: "bee browse -p PROJECT --documents" },
    { description: "Open shared files", command: "bee browse -p PROJECT --files" },
    { description: "Open git repositories", command: "bee browse -p PROJECT --git" },
    { description: "Open Subversion", command: "bee browse -p PROJECT --svn" },
    { description: "Open project settings", command: "bee browse -p PROJECT --settings" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9_]+-\d+$/;

const browse = withUsage(
  defineCommand({
    meta: {
      name: "browse",
      description: "Open a Backlog page in the browser",
    },
    args: {
      target: {
        type: "positional",
        description: "Issue ID or issue key",
        required: false,
        valueHint: "<PROJECT-123>",
      },
      project: commonArgs.project,
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

      const url = resolveUrl(host, args);
      await openUrl(url);
      consola.info(`Opening ${url} in your browser.`);
    },
  }),
  commandUsage,
);

type SectionArgs = {
  target?: string;
  project?: string;
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

const resolveUrl = (host: string, args: SectionArgs): string => {
  // Issue key target takes priority
  if (args.target && ISSUE_KEY_PATTERN.test(args.target)) {
    return issueUrl(host, args.target);
  }

  // Project section pages require --project or target
  const projectKey = args.target ?? args.project;

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
    return projectUrl(host, projectKey);
  }

  // Default: dashboard
  return dashboardUrl(host);
};

export { commandUsage, browse };
