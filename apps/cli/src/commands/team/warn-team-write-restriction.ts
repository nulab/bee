import { UserError } from "@repo/cli-utils";

/**
 * Throws a UserError if the error is a 400 with an empty body (typical of plan
 * restrictions or insufficient permissions for team write operations).
 *
 * Returns false for all other errors so the caller can re-throw them.
 */
export const handleTeamWriteError = (error: unknown): boolean => {
  if (error instanceof Error && "_status" in error) {
    const record = error as unknown as Record<string, unknown>;
    if (record._status === 400 && !record._body) {
      throw new UserError(
        "Team write operations require Administrator role and are not available on new plan spaces.",
      );
    }
  }
  return false;
};
