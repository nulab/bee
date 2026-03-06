import consola from "consola";

/**
 * Returns true if the error is a 400 with an empty body (typical of plan
 * restrictions or insufficient permissions for team write operations).
 * Logs a human-readable error message and calls process.exit(1).
 *
 * Returns false for all other errors so the caller can re-throw them.
 */
export const handleTeamWriteError = (error: unknown): boolean => {
  if (error instanceof Error && "_status" in error) {
    const record = error as unknown as Record<string, unknown>;
    if (record._status === 400 && !record._body) {
      consola.error(
        "Team write operations require Administrator role and are not available on new plan spaces.",
      );
      process.exit(1);
      return true;
    }
  }
  return false;
};
