import { parseArg, vInteger } from "@repo/cli-utils";
import { type Client, getMyself } from "backlog-js";

/**
 * Resolve a user identifier to a numeric user ID.
 *
 * Accepts `@me` (resolved via `getMyself()`) or a numeric ID string.
 */
export const resolveUserId = async (client: Client, value: string): Promise<number> => {
  if (value === "@me") {
    const me = await getMyself(client);
    return me.id;
  }
  return parseArg(vInteger, value, "user");
};
