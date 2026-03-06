import { defineCommand, runCommand, runMain } from "citty";
import { handleBacklogApiError } from "./lib/api-error-handler";
import { showCommandUsage } from "./lib/command-usage";
import { handleValidationError } from "./lib/validation-error";
import pkg from "../package.json" with { type: "json" };
import consola from "consola";

const main = defineCommand({
  meta: {
    name: "bee",
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    auth: () => import("./commands/auth/index").then((m) => m.auth),
    project: () => import("./commands/project/index").then((m) => m.project),
    issue: () => import("./commands/issue/index").then((m) => m.issue),
    document: () => import("./commands/document/index").then((m) => m.document),
    notification: () => import("./commands/notification/index").then((m) => m.notification),
    pr: () => import("./commands/pr/index").then((m) => m.pr),
    repo: () => import("./commands/repo/index").then((m) => m.repo),
    user: () => import("./commands/user/index").then((m) => m.user),
    wiki: () => import("./commands/wiki/index").then((m) => m.wiki),
  },
});

const rawArgs = process.argv.slice(2);

// Use runMain for --help / --version (preserves citty's built-in handling).
// For normal execution, use runCommand directly so we can intercept errors
// (runMain swallows errors internally, preventing custom error handling).
if (rawArgs.includes("--help") || rawArgs.includes("-h") || rawArgs.includes("--version")) {
  void runMain(main, { showUsage: showCommandUsage });
} else {
  const useJson = rawArgs.includes("--json") || !process.stdout.isTTY;
  try {
    await runCommand(main, { rawArgs });
  } catch (error) {
    if (!handleBacklogApiError(error, { json: useJson }) && !handleValidationError(error)) {
      consola.error(error);
    }
    process.exit(1);
  }
}
