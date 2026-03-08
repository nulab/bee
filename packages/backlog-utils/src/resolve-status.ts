import { type Backlog } from "backlog-js";
import { ISSUE_STATUS_NAMES, IssueStatusName } from "./issue-constants";

/**
 * Resolve a status value (name or numeric ID) to a numeric status ID.
 *
 * Lookup order:
 * 1. Parse as number — return as-is if valid
 * 2. Match against built-in status names (open, in-progress, resolved, closed)
 * 3. Fetch project statuses and match by name (case-insensitive)
 */
export const resolveStatusId = async (
  client: Backlog,
  value: string,
  projectIdOrKey?: string,
): Promise<number> => {
  // 1. Numeric ID
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && String(asNumber) === value) {
    return asNumber;
  }

  // 2. Built-in status name
  const lower = value.toLowerCase();
  const builtIn = IssueStatusName[lower];
  if (builtIn !== undefined) {
    return builtIn;
  }

  // 3. Project custom status (requires project context)
  if (projectIdOrKey) {
    const statuses = await client.getProjectStatuses(projectIdOrKey);
    const match = statuses.find((s) => s.name.toLowerCase() === lower);
    if (match) {
      return match.id;
    }
  }

  throw new Error(
    `Unknown status "${value}". Built-in values: ${ISSUE_STATUS_NAMES.join(", ")}` +
      (projectIdOrKey ? ". No matching custom status found in the project either." : ""),
  );
};
