import type * as BacklogJs from "backlog-js";
import { vi } from "vite-plus/test";

const actual = await vi.importActual<typeof BacklogJs>("backlog-js");

const isApiFunction = (name: string, value: unknown): boolean =>
  typeof value === "function" && /^[a-z]/.test(name) && name !== "createClient";

/**
 * backlog-js with every API function (`getIssue(client, ...args)`) forwarded to
 * the method of the same name on the client (`client.getIssue(...args)`), so
 * tests keep stubbing and asserting on the mock client returned by `getClient`.
 * Everything else (`createClient`, `Error`, `OAuth2`, ...) is the real module.
 */
const mockBacklogJs = Object.fromEntries(
  Object.entries(actual).map(([name, value]) => [
    name,
    isApiFunction(name, value)
      ? (client: Record<string, (...args: unknown[]) => unknown>, ...args: unknown[]) =>
          client[name](...args)
      : value,
  ]),
) as typeof BacklogJs;

// Default export for use with:
// vi.mock("backlog-js", () => import("@repo/test-utils/mock-backlog-js").then((m) => m.default))
// eslint-disable-next-line import/no-default-export
export default mockBacklogJs;
