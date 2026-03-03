/**
 * Shared output formatting utilities for `--json` flag support.
 *
 * Each command opts in by spreading `outputArgs` into its `args` definition
 * and wrapping its display logic with `outputResult()`.
 */

/**
 * Common `--json` flag definition to spread into command args.
 *
 * @example
 * ```ts
 * args: {
 *   ...outputArgs,
 *   // other args
 * }
 * ```
 */
const outputArgs = {
  json: {
    type: "string" as const,
    description: "Output as JSON (optionally filter by field names, comma-separated)",
  },
} as const;

/**
 * Picks specified top-level fields from a plain object.
 */
const pickFields = (obj: unknown, fields: string[]): Record<string, unknown> => {
  if (typeof obj !== "object" || obj === null) {
    return {};
  }
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = (obj as Record<string, unknown>)[field];
    }
  }
  return result;
};

/**
 * Filters data to include only the specified fields.
 * Works on both single objects and arrays.
 */
const filterFields = <T>(data: T, fields: string[]): unknown => {
  if (Array.isArray(data)) {
    return data.map((item) => pickFields(item, fields));
  }
  return pickFields(data, fields);
};

/**
 * Outputs structured data based on the `--json` flag.
 *
 * - No `--json`: calls `defaultFormat` for human-readable output
 * - `--json` (no value): outputs full JSON
 * - `--json field1,field2`: outputs JSON filtered to specified fields
 *
 * JSON is pretty-printed when stdout is a TTY, compact otherwise.
 */
const outputResult = <T>(
  data: T,
  args: { json?: string },
  defaultFormat: (data: T) => void,
): void => {
  if (args.json === undefined) {
    defaultFormat(data);
    return;
  }

  const output = args.json
    ? filterFields(
        data,
        args.json.split(",").map((f) => f.trim()),
      )
    : data;

  const json = process.stdout.isTTY ? JSON.stringify(output, null, 2) : JSON.stringify(output);

  process.stdout.write(`${json}\n`);
};

export { outputArgs, pickFields, filterFields, outputResult };
