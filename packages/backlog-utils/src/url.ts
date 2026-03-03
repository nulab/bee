import open from "open";

/**
 * Opens a URL in the default browser with proper error handling.
 */
export async function openUrl(url: string): Promise<void> {
  await open(url);
}

/**
 * Builds a full Backlog web URL for the given resource path.
 *
 * @param host - Backlog space hostname (e.g., "example.backlog.com").
 * @param path - Resource path (e.g., "/view/PROJ-1").
 */
export function buildBacklogUrl(host: string, path: string): string {
  return `https://${host}${path}`;
}

/** Returns the URL for an issue page. */
export function issueUrl(host: string, issueKey: string): string {
  return buildBacklogUrl(host, `/view/${issueKey}`);
}

/** Returns the URL for a project page. */
export function projectUrl(host: string, projectKey: string): string {
  return buildBacklogUrl(host, `/projects/${projectKey}`);
}

/** Returns the URL for a pull request page. */
export function pullRequestUrl(
  host: string,
  projectKey: string,
  repoName: string,
  prNumber: number,
): string {
  return buildBacklogUrl(host, `/git/${projectKey}/${repoName}/pullRequests/${prNumber}`);
}

/** Returns the URL for a repository page. */
export function repositoryUrl(host: string, projectKey: string, repoName: string): string {
  return buildBacklogUrl(host, `/git/${projectKey}/${repoName}`);
}

/** Returns the URL for a wiki page. */
export function wikiUrl(host: string, wikiId: number): string {
  return buildBacklogUrl(host, `/alias/wiki/${wikiId}`);
}

/** Returns the URL for a document page. */
export function documentUrl(host: string, projectKey: string, documentId: string): string {
  return buildBacklogUrl(host, `/projects/${projectKey}/document/${documentId}`);
}

/** Returns the URL for the dashboard. */
export function dashboardUrl(host: string): string {
  return buildBacklogUrl(host, "/dashboard");
}
