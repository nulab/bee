/**
 * An error representing a known, expected failure condition.
 *
 * UserError is for "normal" errors — invalid input, missing configuration,
 * failed authentication, etc. The global error handler prints only the
 * message (via `consola.error`) with **no stack trace**.
 *
 * Any error that is NOT a UserError (and not a handled API/validation error)
 * is treated as an unexpected bug and printed with the full stack trace.
 */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}
