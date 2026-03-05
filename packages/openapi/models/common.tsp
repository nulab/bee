using TypeSpec.Http;

namespace Backlog;

// ────────────────────────────────────────────
// Error
// ────────────────────────────────────────────

/** Error code returned by the Backlog API. */
enum BacklogErrorCode {
  InternalError: 1,
  LicenceError: 2,
  LicenceExpiredError: 3,
  AccessDeniedError: 4,
  UnauthorizedOperationError: 5,
  NoResourceError: 6,
  InvalidRequestError: 7,
  SpaceOverCapacityError: 8,
  ResourceOverflowError: 9,
  TooLargeFileError: 10,
  AuthenticationError: 11,
  RequiredMFAError: 12,
  TooManyRequestsError: 13,
}

model BacklogErrorDetail {
  message: string;
  code: BacklogErrorCode;
  moreInfo: string;
}

@error
model BacklogErrorResponse {
  errors: BacklogErrorDetail[];
}

// ────────────────────────────────────────────
// Shared enums
// ────────────────────────────────────────────

/** Sort order. */
enum SortOrder {
  asc,
  desc,
}

/** Text formatting rule for projects. */
enum TextFormattingRule {
  backlog,
  markdown,
}

// ────────────────────────────────────────────
// Shared models
// ────────────────────────────────────────────

/** Nulab account information. */
model NulabAccount {
  nulabId: string;
  name: string | null;
  uniqueId: string | null;
  iconUrl: string;
}

/** Backlog user. */
model User {
  id: int64;

  userId: string | null;
  name: string;
  roleType: int32;
  lang: string | null;
  mailAddress: string | null;

  keyword: string;
  lastLoginTime: utcDateTime | null;
  nulabAccount: NulabAccount | null;
}
