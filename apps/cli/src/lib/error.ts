import { CommanderError } from "commander";
import { handleBacklogApiError } from "@repo/backlog-utils";
import { UserError, handleValidationError } from "@repo/cli-utils";
import consola, { LogLevels } from "consola";

const handleError = (error: unknown): never | void => {
  if (error instanceof CommanderError) {
    if (error.exitCode === 0) {
      return;
    }
    process.exit(error.exitCode);
  }

  const showStack = consola.level >= LogLevels.debug;
  const useJson = process.argv.includes("--json") || !process.stdout.isTTY;

  if (error instanceof UserError) {
    consola.error(showStack ? error : error.message);
  } else if (!handleBacklogApiError(error, { json: useJson }) && !handleValidationError(error)) {
    consola.error(error);
  }

  process.exit(1);
};

export { handleError };
