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

const RcAuthSchema = v.variant("method", [ApiKeyAuthSchema, OAuthAuthSchema]);

const RcSpaceSchema = v.object({
  host: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.backlog\.(com|jp)$/)),
  auth: RcAuthSchema,
});

const RcSchema = v.object({
  defaultSpace: v.optional(v.string()),
  spaces: v.optional(v.array(RcSpaceSchema), []),
  aliases: v.optional(v.record(v.string(), v.string()), {}),
});

type RcAuth = v.InferOutput<typeof RcAuthSchema>;

type RcSpace = v.InferOutput<typeof RcSpaceSchema>;

type Rc = v.InferOutput<typeof RcSchema>;

export { RcAuthSchema, RcSchema, RcSpaceSchema };
export type { Rc, RcAuth, RcSpace };
