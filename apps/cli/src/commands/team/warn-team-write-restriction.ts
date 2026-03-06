import consola from "consola";

/**
 * Logs a hint when a team write API call fails with an empty 400 response,
 * which typically indicates a plan restriction or insufficient permissions.
 *
 * Team write operations (create/edit) require Administrator role and are
 * not available on new plan spaces.
 */
export const warnTeamWriteRestriction = (error: unknown): void => {
  if (
    error instanceof Error &&
    "_status" in error &&
    (error as unknown as Record<string, unknown>)._status === 400
  ) {
    consola.info(
      "Hint: Team write operations require Administrator role and are not available on new plan spaces.",
    );
  }
};
