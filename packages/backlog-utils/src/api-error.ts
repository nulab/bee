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

export { errorCodeName, isBacklogErrorResponse, formatBacklogError };
export type { BacklogErrorResponse };
