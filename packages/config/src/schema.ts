import * as v from "valibot";

const ApiKeyAuthSchema = v.object({
  method: v.literal("api-key"),
  apiKey: v.string(),
});

const OAuthAuthSchema = v.object({
  method: v.literal("oauth"),
  accessToken: v.string(),
  refreshToken: v.string(),
  clientId: v.optional(v.string()),
  clientSecret: v.optional(v.string()),
});

export const RcAuthSchema = v.variant("method", [ApiKeyAuthSchema, OAuthAuthSchema]);

export const RcSpaceSchema = v.object({
  host: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.backlog\.(com|jp)$/)),
  auth: RcAuthSchema,
});

export const RcSchema = v.object({
  defaultSpace: v.optional(v.string()),
  spaces: v.optional(v.array(RcSpaceSchema), []),
  aliases: v.optional(v.record(v.string(), v.string()), {}),
});

export type RcAuth = v.InferOutput<typeof RcAuthSchema>;

export type RcSpace = v.InferOutput<typeof RcSpaceSchema>;

export type Rc = v.InferOutput<typeof RcSchema>;
