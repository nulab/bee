import { type Command } from "commander";

/**
 * Every top-level command, in the order they are presented to users.
 *
 * Imports stay lazy so `bee <command>` only pays for the module it runs, and so
 * the Skill generator can load the whole tree without executing the CLI entry
 * point (which parses argv on import).
 */
const commandModules: (() => Promise<{ default: Command }>)[] = [
  () => import("./auth/index.js"),
  () => import("./project/index.js"),
  () => import("./issue/index.js"),
  () => import("./document/index.js"),
  () => import("./notification/index.js"),
  () => import("./pr/index.js"),
  () => import("./repo/index.js"),
  () => import("./team/index.js"),
  () => import("./user/index.js"),
  () => import("./wiki/index.js"),
  () => import("./category/index.js"),
  () => import("./milestone/index.js"),
  () => import("./issue-type/index.js"),
  () => import("./space/index.js"),
  () => import("./status/index.js"),
  () => import("./star/index.js"),
  () => import("./watching/index.js"),
  () => import("./dashboard.js"),
  () => import("./browse.js"),
  () => import("./api.js"),
  () => import("./completion.js"),
];

const loadCommands = (): Promise<{ default: Command }>[] => commandModules.map((load) => load());

export { loadCommands };
