import { vInteger } from "@repo/cli-utils";
import { type Backlog } from "backlog-js";
import * as v from "valibot";

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
  return v.parse(vInteger, value);
};
