import { type FlatErrors, ValiError, flatten } from "valibot";
import consola from "consola";

/**
 * Handles ValiError from hey-api's response validators.
 * Returns true if the error was a ValiError and was handled.
 */
export const handleValidationError = (error: unknown): boolean => {
  if (!(error instanceof ValiError)) {
    return false;
  }

  consola.error("API response validation failed.");

  const flat: FlatErrors<undefined> = flatten(error.issues);

  consola.debug("Validation details:");
  if (flat.root) {
    consola.debug(`  (root): ${flat.root.join(", ")}`);
  }
  if (flat.nested) {
    for (const [field, errors] of Object.entries(flat.nested)) {
      consola.debug(`  ${field}: ${errors?.join(", ")}`);
    }
  }
  if (flat.other) {
    consola.debug(`  (other): ${flat.other.join(", ")}`);
  }

  consola.debug("Raw error:", error);

  return true;
};
