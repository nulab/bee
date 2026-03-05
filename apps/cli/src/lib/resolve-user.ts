import { type Backlog } from "backlog-js";

/**
 * Resolve a user identifier to a numeric user ID.
 *
 * Accepts `@me` (resolved via `getMyself()`) or a numeric ID string.
 */
export const resolveUserId = async (client: Backlog, value: string): Promise<number> => {
  if (value === "@me") {
    const me = await client.getMyself();
    return me.id;
  }
  return Number(value);
};
