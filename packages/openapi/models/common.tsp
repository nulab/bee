using TypeSpec.Http;

namespace Backlog;

// ────────────────────────────────────────────
// Error
// ────────────────────────────────────────────

model BacklogErrorDetail {
  message: string;

  @doc("""
    1: InternalError, 2: LicenceError, 3: LicenceExpiredError,
    4: AccessDeniedError, 5: UnauthorizedOperationError, 6: NoResourceError,
    7: InvalidRequestError, 8: SpaceOverCapacityError, 9: ResourceOverflowError,
    10: TooLargeFileError, 11: AuthenticationError, 12: RequiredMFAError,
    13: TooManyRequestsError
    """)
  code: int32;

  moreInfo: string;
}

@error
model BacklogErrorResponse {
  errors: BacklogErrorDetail[];
}

// ────────────────────────────────────────────
// Shared scalars
// ────────────────────────────────────────────

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
