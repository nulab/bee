import * as v from "valibot";
import consola from "consola";
import { UserError } from "./user-error";

/**
 * Schema that transforms a string to a validated finite number.
 * Rejects NaN and Infinity — use this instead of bare `Number()` casting.
 */
const vFiniteNumber = v.pipe(v.string(), v.transform(Number), v.number(), v.finite());

/**
 * Schema that transforms a string to a validated integer.
 * Rejects NaN, Infinity, and non-integer values.
 */
const vInteger = v.pipe(v.string(), v.transform(Number), v.number(), v.integer());

/**
 * Parse a CLI argument with a valibot schema, throwing a UserError on failure.
 *
 * Unlike bare `v.parse()`, this converts ValiError into a UserError so the
 * global error handler shows a friendly message instead of
 * "API response validation failed."
 */
const parseArg = <S extends v.GenericSchema>(
  schema: S,
  value: v.InferInput<S>,
  label: string,
): v.InferOutput<S> => {
  const result = v.safeParse(schema, value);
  if (result.success) {
    return result.output;
  }
  const reason = result.issues[0]?.message;
  const message = reason
    ? `Invalid value for "${label}": "${value}" — ${reason}`
    : `Invalid value for "${label}": "${value}"`;
  consola.debug("parseArg validation issues:", result.issues);
  throw new UserError(message);
};

export { vFiniteNumber, vInteger, parseArg };
