import consola from "consola";

const errorCodeNames: Record<number, string> = {
  1: "InternalError",
  2: "LicenceError",
  3: "LicenceExpiredError",
  4: "AccessDeniedError",
  5: "UnauthorizedOperationError",
  6: "NoResourceError",
  7: "InvalidRequestError",
  8: "SpaceOverCapacityError",
  9: "ResourceOverflowError",
  10: "TooLargeFileError",
  11: "AuthenticationError",
  12: "RequiredMFAError",
  13: "TooManyRequestsError",
};

type BacklogErrorDetail = {
  message: string;
  code: number;
  moreInfo: string;
};

type BacklogErrorResponse = {
  errors: BacklogErrorDetail[];
};

const errorCodeName = (code: number): string | undefined => errorCodeNames[code];

const isBacklogErrorDetail = (value: unknown): value is BacklogErrorDetail =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as BacklogErrorDetail).message === "string" &&
  typeof (value as BacklogErrorDetail).code === "number" &&
  typeof (value as BacklogErrorDetail).moreInfo === "string";

const isBacklogErrorResponse = (value: unknown): value is BacklogErrorResponse =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as BacklogErrorResponse).errors) &&
  (value as BacklogErrorResponse).errors.length > 0 &&
  (value as BacklogErrorResponse).errors.every(isBacklogErrorDetail);

const formatBacklogError = (response: BacklogErrorResponse): string[] =>
  response.errors.map((e) => {
    const name = errorCodeNames[e.code] ?? "UnknownError";
    const info = e.moreInfo ? ` (${e.moreInfo})` : "";
    return `${name}: ${e.message}${info}`;
  });

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
 * Extracts debug details (URL, HTTP status) from a backlog-js error.
 * backlog-js stores these in private `_url` / `_status` fields.
 */
const extractDebugDetails = (error: unknown): { url?: string; status?: number } => {
  if (!(error instanceof Error)) {
    return {};
  }
  const record = error as unknown as Record<string, unknown>;
  return {
    url: typeof record._url === "string" ? record._url : undefined,
    status: typeof record._status === "number" ? record._status : undefined,
  };
};

/**
 * Handles Backlog API error responses thrown by backlog-js.
 * Returns true if the error was a Backlog API error and was handled.
 */
const handleBacklogApiError = (error: unknown, options: { json: boolean }): boolean => {
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

  const details = extractDebugDetails(error);
  if (details.url) {
    consola.debug(`Request URL: ${details.url}`);
  }
  if (details.status !== undefined) {
    consola.debug(`HTTP status: ${details.status}`);
  }

  return true;
};

export { errorCodeName, isBacklogErrorResponse, formatBacklogError, handleBacklogApiError };
export type { BacklogErrorResponse };
