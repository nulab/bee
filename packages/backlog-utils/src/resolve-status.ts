import { type Backlog } from "backlog-js";

/**
 * Resolve a status value (name or numeric ID) to a numeric status ID.
 *
 * - Numeric strings are treated as IDs and returned as-is.
 * - Non-numeric strings are looked up by name (case-insensitive) against the
 *   project's status list fetched from the API.  This covers both built-in
 *   statuses (whose display names depend on the project language, e.g. "Open"
 *   vs "未着手") and custom statuses.
 */
export const resolveStatusId = async (
  client: Backlog,
  value: string,
  projectIdOrKey: string,
): Promise<number> => {
  // Numeric ID — return as-is
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && String(asNumber) === value) {
    return asNumber;
  }

  // Name lookup via API
  const statuses = await client.getProjectStatuses(projectIdOrKey);
  const lower = value.toLowerCase();
  const match = statuses.find((s) => s.name.toLowerCase() === lower);
  if (match) {
    return match.id;
  }

  const known = statuses.map((s) => s.name).join(", ");
  throw new Error(`Unknown status "${value}". Available statuses: ${known}`);
};
