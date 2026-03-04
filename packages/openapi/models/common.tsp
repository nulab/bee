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
// Shared enums
// ────────────────────────────────────────────

/**
 * User role type.
 * - 1: Administrator
 * - 2: Normal User
 * - 3: Reporter
 * - 4: Viewer
 * - 5: Guest Reporter
 * - 6: Guest Viewer
 */
enum UserRoleType {
  Administrator: 1,
  NormalUser: 2,
  Reporter: 3,
  Viewer: 4,
  GuestReporter: 5,
  GuestViewer: 6,
}

// ────────────────────────────────────────────
// Shared models
// ────────────────────────────────────────────

/** Nulab account information. */
model NulabAccount {
  nulabId: string;
  name: string;
  uniqueId: string;
}

/** Backlog user. */
model User {
  id: int64;
  userId: string;
  name: string;
  roleType: UserRoleType;
  lang: string | null;
  mailAddress: string;
  lastLoginTime: utcDateTime | null;
  nulabAccount: NulabAccount | null;
}
