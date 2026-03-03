import open from "open";

/**
 * Opens a URL in the default browser with proper error handling.
 */
const openUrl = async (url: string): Promise<void> => {
  await open(url);
};

/**
 * Builds a full Backlog web URL for the given resource path.
 *
 * @param host - Backlog space hostname (e.g., "example.backlog.com").
 * @param path - Resource path (e.g., "/view/PROJ-1").
 */
const buildBacklogUrl = (host: string, path: string): string => `https://${host}${path}`;

/** Returns the URL for an issue page. */
const issueUrl = (host: string, issueKey: string): string =>
  buildBacklogUrl(host, `/view/${issueKey}`);

/** Returns the URL for a project page. */
const projectUrl = (host: string, projectKey: string): string =>
  buildBacklogUrl(host, `/projects/${projectKey}`);

/** Returns the URL for a pull request page. */
const pullRequestUrl = (
  host: string,
  projectKey: string,
  repoName: string,
  prNumber: number,
): string => buildBacklogUrl(host, `/git/${projectKey}/${repoName}/pullRequests/${prNumber}`);

/** Returns the URL for a repository page. */
const repositoryUrl = (host: string, projectKey: string, repoName: string): string =>
  buildBacklogUrl(host, `/git/${projectKey}/${repoName}`);

/** Returns the URL for a wiki page. */
const wikiUrl = (host: string, wikiId: number): string =>
  buildBacklogUrl(host, `/alias/wiki/${wikiId}`);

/** Returns the URL for a document page. */
const documentUrl = (host: string, projectKey: string, documentId: string): string =>
  buildBacklogUrl(host, `/projects/${projectKey}/document/${documentId}`);

/** Returns the URL for the dashboard. */
const dashboardUrl = (host: string): string => buildBacklogUrl(host, "/dashboard");

export {
  buildBacklogUrl,
  dashboardUrl,
  documentUrl,
  issueUrl,
  openUrl,
  projectUrl,
  pullRequestUrl,
  repositoryUrl,
  wikiUrl,
};
