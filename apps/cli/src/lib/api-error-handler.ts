import { formatBacklogError, isBacklogErrorResponse } from "@repo/backlog-utils";
import consola from "consola";

/**
 * Extracts the error body from a backlog-js error.
 *
 * backlog-js compiles classes to ES5 with private `_body` / `_name` fields
 * and getter-based access on the prototype. Due to CJS/ESM interop issues,
 * `instanceof` and the getters may not work reliably, so we access `_body`
 * directly as a duck-typing check.
 */
const extractBacklogErrorBody = (error: unknown): unknown => {
  if (error instanceof Error && "_body" in error && "_name" in error) {
    const record = error as unknown as Record<string, unknown>;
    if (
      typeof record._name === "string" &&
      ["BacklogApiError", "BacklogAuthError"].includes(record._name)
    ) {
      return record._body;
    }
  }
  return error;
};

/**
 * Handles Backlog API error responses thrown by backlog-js.
 * Returns true if the error was a Backlog API error and was handled.
 */
export const handleBacklogApiError = (error: unknown, options: { json: boolean }): boolean => {
  const errorBody = extractBacklogErrorBody(error);

  if (!isBacklogErrorResponse(errorBody)) {
    return false;
  }

  if (options.json) {
    process.stderr.write(`${JSON.stringify(errorBody)}\n`);
    return true;
  }

  for (const line of formatBacklogError(errorBody)) {
    consola.error(line);
  }
  return true;
};
