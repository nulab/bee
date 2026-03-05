import { formatBacklogError, isBacklogErrorResponse } from "@repo/backlog-utils";
import consola from "consola";

/**
 * Handles Backlog API error responses thrown by hey-api client (throwOnError).
 * Returns true if the error was a Backlog API error and was handled.
 */
export const handleBacklogApiError = (error: unknown, options: { json: boolean }): boolean => {
  if (!isBacklogErrorResponse(error)) {
    return false;
  }

  if (options.json) {
    process.stderr.write(`${JSON.stringify(error)}\n`);
    return true;
  }

  for (const line of formatBacklogError(error)) {
    consola.error(line);
  }
  return true;
};
