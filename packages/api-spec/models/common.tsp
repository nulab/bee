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
