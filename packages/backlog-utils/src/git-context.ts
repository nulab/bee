import { execFile } from "node:child_process";

type GitContext = {
  host: string;
  projectKey: string;
  repoName: string;
};

/**
 * Parses a Backlog git remote URL into its components.
 *
 * Supports both SSH and HTTPS formats:
 * - SSH:   `<user>@<space>.git.backlog.com:/<PROJECT>/<repo>.git`
 * - HTTPS: `https://<space>.backlog.com/git/<PROJECT>/<repo>.git`
 *
 * Works with both `.backlog.com` and `.backlog.jp` domains.
 */
const parseBacklogRemoteUrl = (url: string): GitContext | undefined => {
  // SSH format: <user>@<space>.git.backlog.com:/<PROJECT>/<repo>.git
  // or:         <user>@<space>.git.backlog.jp:/<PROJECT>/<repo>.git
  const sshMatch = url.match(
    /^.+@(.+)\.git\.(backlog\.(?:com|jp)):\/?([^/]+)\/([^/]+?)(?:\.git)?$/,
  );
  if (sshMatch) {
    const [, space, domain, projectKey, repoName] = sshMatch;
    return {
      host: `${space}.${domain}`,
      projectKey,
      repoName,
    };
  }

  // HTTPS format: https://<space>.backlog.com/git/<PROJECT>/<repo>.git
  // or:           https://<space>.backlog.jp/git/<PROJECT>/<repo>.git
  const httpsMatch = url.match(
    /^https?:\/\/(.+\.backlog\.(?:com|jp))\/git\/([^/]+)\/([^/]+?)(?:\.git)?$/,
  );
  if (httpsMatch) {
    const [, host, projectKey, repoName] = httpsMatch;
    return {
      host,
      projectKey,
      repoName,
    };
  }

  return undefined;
};

const execGit = (args: string[], cwd?: string): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile("git", args, { cwd }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });

/**
 * Detects the Backlog git context from the current directory's git remote.
 *
 * Reads the `origin` remote URL and parses it. Returns `undefined` when not
 * inside a Backlog repository.
 */
const detectGitContext = async (cwd?: string): Promise<GitContext | undefined> => {
  try {
    const remoteUrl = await execGit(["remote", "get-url", "origin"], cwd);
    return parseBacklogRemoteUrl(remoteUrl);
  } catch {
    return undefined;
  }
};

/**
 * Returns the current git branch name, or `undefined` if detached or not in a repo.
 */
const getCurrentBranch = async (cwd?: string): Promise<string | undefined> => {
  try {
    return await execGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  } catch {
    return undefined;
  }
};

/**
 * Returns the latest commit SHA (short form), or `undefined` if not in a repo.
 */
const getLatestCommit = async (cwd?: string): Promise<string | undefined> => {
  try {
    return await execGit(["rev-parse", "HEAD"], cwd);
  } catch {
    return undefined;
  }
};

/**
 * Returns the path from the git repository root to the current directory.
 * Used to resolve relative file paths to repo-relative paths.
 */
const getRepoRelativePath = async (cwd?: string): Promise<string | undefined> => {
  try {
    const prefix = await execGit(["rev-parse", "--show-prefix"], cwd);
    return prefix || undefined;
  } catch {
    return undefined;
  }
};

export {
  type GitContext,
  detectGitContext,
  getCurrentBranch,
  getLatestCommit,
  getRepoRelativePath,
  parseBacklogRemoteUrl,
};
