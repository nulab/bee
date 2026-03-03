import type {
  BacklogIssueType,
  BacklogPriority,
  BacklogProject,
  BacklogResolution,
  BacklogStatus,
  BacklogUser,
} from "@repo/api";
import type { BacklogClient } from "#/client.js";

import consola from "consola";

/**
 * Resolves the project key from the provided argument or `BACKLOG_PROJECT` environment variable.
 *
 * @param argValue - The value provided via `--project` flag.
 * @returns The resolved project key.
 * @throws Exits with code 1 if neither the argument nor the environment variable is set.
 */
const resolveProjectArg = (argValue?: string): string => {
  const project = argValue || process.env.BACKLOG_PROJECT;

  if (!project) {
    consola.error(
      "Project key is required. Specify --project (-p) or set BACKLOG_PROJECT environment variable.",
    );
    return process.exit(1);
  }

  return project;
};

/**
 * Generic name-to-ID resolver factory.
 *
 * Fetches a list from the given endpoint, finds an item by matching `nameField`,
 * and returns the item's `id`. Throws a descriptive error listing available names
 * when no match is found.
 */
const resolveByName = async <K extends string, T extends { id: number } & Record<K, string>>(
  client: BacklogClient,
  endpoint: string,
  nameField: K,
  value: string,
  label: string,
): Promise<number> => {
  const items = await client<T[]>(endpoint);
  const item = items.find((i: T) => i[nameField] === value);

  if (!item) {
    const names = items.map((i: T) => i[nameField]).join(", ");
    throw new Error(`${label} "${value}" not found. Available: ${names}`);
  }

  return item.id;
};

/**
 * Resolves a project key to a project ID.
 */
const resolveProjectId = async (client: BacklogClient, projectKey: string): Promise<number> => {
  const project = await client<BacklogProject>(`/projects/${projectKey}`);
  return project.id;
};

/**
 * Resolves a username to a user ID. Supports `@me` for the current user.
 */
const resolveUserId = async (client: BacklogClient, username: string): Promise<number> => {
  if (username === "@me") {
    const me = await client<BacklogUser>("/users/myself");
    return me.id;
  }

  const users = await client<BacklogUser[]>("/users");
  const user = users.find((u: BacklogUser) => u.userId === username || u.name === username);

  if (!user) {
    throw new Error(`User "${username}" not found.`);
  }

  return user.id;
};

/**
 * Resolves a priority name to its ID.
 */
const resolvePriorityId = (client: BacklogClient, name: string): Promise<number> =>
  resolveByName<"name", BacklogPriority>(client, "/priorities", "name", name, "Priority");

/**
 * Resolves a status name to its ID within a project.
 */
const resolveStatusId = async (
  client: BacklogClient,
  projectKey: string,
  name: string,
): Promise<number> => {
  const items = await client<BacklogStatus[]>(`/projects/${projectKey}/statuses`);
  const item = items.find((s: BacklogStatus) => s.name === name);

  if (!item) {
    const names = items.map((s: BacklogStatus) => s.name).join(", ");
    throw new Error(`Status "${name}" not found in project ${projectKey}. Available: ${names}`);
  }

  return item.id;
};

/**
 * Resolves the "completed" status ID for a project.
 */
const resolveClosedStatusId = async (
  client: BacklogClient,
  projectKey: string,
): Promise<number> => {
  const statuses = await client<BacklogStatus[]>(`/projects/${projectKey}/statuses`);
  const closed = statuses.find((s: BacklogStatus) => s.id === 4) ?? statuses.at(-1);

  if (!closed) {
    throw new Error(`No statuses found for project ${projectKey}.`);
  }

  return closed.id;
};

/**
 * Resolves the "open" status ID for a project (first status, typically "Open").
 */
const resolveOpenStatusId = async (client: BacklogClient, projectKey: string): Promise<number> => {
  const statuses = await client<BacklogStatus[]>(`/projects/${projectKey}/statuses`);
  const open = statuses.find((s: BacklogStatus) => s.id === 1) ?? statuses[0];

  if (!open) {
    throw new Error(`No statuses found for project ${projectKey}.`);
  }

  return open.id;
};

/**
 * Resolves an issue type name to its ID within a project.
 */
const resolveIssueTypeId = async (
  client: BacklogClient,
  projectKey: string,
  name: string,
): Promise<number> => {
  const items = await client<BacklogIssueType[]>(`/projects/${projectKey}/issueTypes`);
  const item = items.find((t: BacklogIssueType) => t.name === name);

  if (!item) {
    const names = items.map((t: BacklogIssueType) => t.name).join(", ");
    throw new Error(`Issue type "${name}" not found in project ${projectKey}. Available: ${names}`);
  }

  return item.id;
};

/**
 * Resolves a resolution name to its ID.
 */
const resolveResolutionId = (client: BacklogClient, name: string): Promise<number> =>
  resolveByName<"name", BacklogResolution>(client, "/resolutions", "name", name, "Resolution");

/**
 * Extracts the project key from an issue key (e.g., "PROJECT-123" -> "PROJECT").
 */
const extractProjectKey = (issueKey: string): string => {
  const match = issueKey.match(/^([A-Z][A-Z0-9_]+)-\d+$/);

  if (!match?.[1]) {
    throw new Error(`Invalid issue key format: "${issueKey}". Expected format: PROJECT-123`);
  }

  return match[1];
};

export {
  extractProjectKey,
  resolveByName,
  resolveClosedStatusId,
  resolveIssueTypeId,
  resolveOpenStatusId,
  resolvePriorityId,
  resolveProjectArg,
  resolveProjectId,
  resolveResolutionId,
  resolveStatusId,
  resolveUserId,
};
