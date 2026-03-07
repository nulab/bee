import {
  type GitContext,
  buildBacklogUrl,
  dashboardUrl,
  gitBlobUrl,
  gitCommitUrl,
  gitTreeUrl,
  issueUrl,
  projectUrl,
  repositoryUrl,
} from "@repo/backlog-utils";

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9_]+-\d+$/;
const ISSUE_NUMBER_PATTERN = /^\d+$/;
const FILE_LINE_PATTERN = /^(.+):(\d+)$/;

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

type GitInfo = {
  context?: GitContext;
  currentBranch?: string;
  latestCommit?: string;
  repoRelativePath?: string;
};

type ResolveResult = { ok: true; url: string } | { ok: false; error: string };

const resolveUrl = (host: string, args: BrowseArgs, git: GitInfo): ResolveResult => {
  // Issue key target takes priority (e.g. PROJECT-123)
  if (args.target && ISSUE_KEY_PATTERN.test(args.target)) {
    return { ok: true, url: issueUrl(host, args.target) };
  }

  // Bare issue number (e.g. 123) — requires project from git context or --project
  if (args.target && ISSUE_NUMBER_PATTERN.test(args.target)) {
    const projectKey = args.project ?? git.context?.projectKey;
    if (projectKey) {
      return { ok: true, url: issueUrl(host, `${projectKey}-${args.target}`) };
    }
    return {
      ok: false,
      error:
        "Cannot resolve issue number without a project. Use --project or run inside a Backlog repository.",
    };
  }

  // File/directory path target (contains / or . or ends with specific patterns)
  if (args.target && isFilePath(args.target)) {
    return resolveFileUrl(host, args, git);
  }

  // Project section pages require --project or target
  const projectKey = args.target ?? args.project ?? git.context?.projectKey;

  if (projectKey) {
    if (args.issues) {
      return { ok: true, url: buildBacklogUrl(host, `/find/${projectKey}`) };
    }
    if (args.board) {
      return { ok: true, url: buildBacklogUrl(host, `/board/${projectKey}`) };
    }
    if (args.gantt) {
      return { ok: true, url: buildBacklogUrl(host, `/gantt/${projectKey}`) };
    }
    if (args.wiki) {
      return { ok: true, url: buildBacklogUrl(host, `/wiki/${projectKey}`) };
    }
    if (args.documents) {
      return { ok: true, url: buildBacklogUrl(host, `/document/${projectKey}`) };
    }
    if (args.files) {
      return { ok: true, url: buildBacklogUrl(host, `/file/${projectKey}`) };
    }
    if (args.git) {
      return { ok: true, url: buildBacklogUrl(host, `/git/${projectKey}`) };
    }
    if (args.svn) {
      return { ok: true, url: buildBacklogUrl(host, `/subversion/${projectKey}`) };
    }
    if (args.settings) {
      return {
        ok: true,
        url: buildBacklogUrl(host, `/EditProject.action?project.id=${projectKey}`),
      };
    }
  }

  // --branch or --commit without target opens the tree at that ref
  if (args.branch || args.commit) {
    return resolveFileUrl(host, args, git);
  }

  // target is a project key (no section flag)
  if (args.target) {
    return { ok: true, url: projectUrl(host, args.target) };
  }

  // No target: inside a Backlog repo → open repo page; otherwise → dashboard
  if (git.context) {
    return {
      ok: true,
      url: repositoryUrl(host, git.context.projectKey, git.context.repoName),
    };
  }

  return { ok: true, url: dashboardUrl(host) };
};

const isFilePath = (target: string): boolean => {
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

const resolveFileUrl = (host: string, args: BrowseArgs, git: GitInfo): ResolveResult => {
  if (!git.context) {
    return {
      ok: false,
      error: "Not inside a Backlog Git repository. Cannot resolve file path.",
    };
  }

  let ref: string;
  if (args.commit) {
    if (!git.latestCommit) {
      return { ok: false, error: "Could not determine the latest commit." };
    }
    // For --commit without target, open the commit page directly
    if (!args.target) {
      return {
        ok: true,
        url: gitCommitUrl(host, git.context.projectKey, git.context.repoName, git.latestCommit),
      };
    }
    ref = git.latestCommit;
  } else if (args.branch) {
    ref = args.branch;
  } else {
    ref = git.currentBranch ?? "main";
  }

  // No target with --branch: open tree at branch root
  if (!args.target) {
    return {
      ok: true,
      url: gitTreeUrl(host, git.context.projectKey, git.context.repoName, ref),
    };
  }

  // Parse line number from target (e.g. src/main.ts:42)
  const lineMatch = args.target.match(FILE_LINE_PATTERN);
  const filePath = lineMatch ? lineMatch[1] : args.target;
  const line = lineMatch ? Number(lineMatch[2]) : undefined;

  // Resolve repo-relative path
  const fullPath = git.repoRelativePath ? `${git.repoRelativePath}${filePath}` : filePath;
  const isDir = filePath.endsWith("/");

  if (isDir) {
    return {
      ok: true,
      url: gitTreeUrl(
        host,
        git.context.projectKey,
        git.context.repoName,
        ref,
        fullPath.replace(/\/$/, ""),
      ),
    };
  }

  return {
    ok: true,
    url: gitBlobUrl(host, git.context.projectKey, git.context.repoName, ref, fullPath, line),
  };
};

export { type BrowseArgs, type GitInfo, type ResolveResult, isFilePath, resolveUrl };
