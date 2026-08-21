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

/**
 * A Backlog space hostname.
 *
 * Any domain is accepted so that self-hosted spaces work, but the value must be
 * a bare hostname: it is interpolated into `https://${host}` by both
 * `buildBacklogUrl` and backlog-js, so a value carrying userinfo, a path, or a
 * scheme (e.g. `example.backlog.com@evil.com`) would silently redirect requests
 * — and the credentials in them — to another origin.
 */
const RcHostSchema = v.pipe(v.string(), v.toLowerCase(), v.domain());

const RcSpaceSchema = v.object({
  host: RcHostSchema,
  auth: RcAuthSchema,
});

const RcSchema = v.object({
  // Lowercased to match the normalized `host` values it is compared against.
  // Not a full host: it may also be a shorthand that `findSpace` expands.
  defaultSpace: v.optional(v.pipe(v.string(), v.toLowerCase())),
  spaces: v.optional(v.array(RcSpaceSchema), []),
  aliases: v.optional(v.record(v.string(), v.string()), {}),
});

type RcAuth = v.InferOutput<typeof RcAuthSchema>;

type RcSpace = v.InferOutput<typeof RcSpaceSchema>;

type Rc = v.InferOutput<typeof RcSchema>;

export { RcAuthSchema, RcHostSchema, RcSchema, RcSpaceSchema };
export type { Rc, RcAuth, RcSpace };
