import { type BaseIssue, type BaseSchema, type InferOutput, safeParse } from "valibot";
import { vFiniteNumber } from "./valibot-utils";

const splitArg = <TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(
  input: string | undefined,
  schema: TSchema,
): InferOutput<TSchema>[] => {
  if (!input) {
    return [];
  }

  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const results: InferOutput<TSchema>[] = [];

  for (const part of parts) {
    const result = safeParse(schema, part);
    if (result.success) {
      results.push(result.output);
      continue;
    }

    const numResult = safeParse(vFiniteNumber, part);
    if (numResult.success) {
      const schemaResult = safeParse(schema, numResult.output);
      if (schemaResult.success) {
        results.push(schemaResult.output);
      }
    }
  }

  return results;
};

export { splitArg };
