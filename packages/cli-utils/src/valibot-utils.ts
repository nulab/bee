import * as v from "valibot";

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

export { vFiniteNumber, vInteger };
