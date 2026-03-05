import { type BaseIssue, type BaseSchema, type InferOutput, safeParse } from "valibot";

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

    const num = Number(part);
    if (!Number.isNaN(num)) {
      const numResult = safeParse(schema, num);
      if (numResult.success) {
        results.push(numResult.output);
      }
    }
  }

  return results;
};

export { splitArg };
