import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { RcAuthSchema, RcSchema, RcSpaceSchema } from "./schema";

describe("RcAuthSchema", () => {
  it("accepts valid api-key auth", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "api-key",
      apiKey: "abc123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({ method: "api-key", apiKey: "abc123" });
    }
  });

  it("accepts valid oauth auth", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        method: "oauth",
        accessToken: "access",
        refreshToken: "refresh",
      });
    }
  });

  it("accepts oauth auth with clientId and clientSecret", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
      clientId: "my-client-id",
      clientSecret: "my-client-secret",
    });
    expect(result.success).toBe(true);
    if (result.success && result.output.method === "oauth") {
      expect(result.output.clientId).toBe("my-client-id");
      expect(result.output.clientSecret).toBe("my-client-secret");
    }
  });

  it("accepts oauth auth without clientId and clientSecret (backward compat)", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid method", () => {
    const result = v.safeParse(RcAuthSchema, { method: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects api-key auth without apiKey", () => {
    const result = v.safeParse(RcAuthSchema, { method: "api-key" });
    expect(result.success).toBe(false);
  });

  it("rejects oauth auth without tokens", () => {
    const result = v.safeParse(RcAuthSchema, { method: "oauth" });
    expect(result.success).toBe(false);
  });
});

describe("RcSpaceSchema", () => {
  const validAuth = { method: "api-key" as const, apiKey: "key" };

  it("accepts valid backlog.com host", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "example.backlog.com",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid backlog.jp host", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "example.backlog.jp",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
  });

  it("accepts host with hyphens and numbers", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "my-team-01.backlog.com",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a backlogtool.com host", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "example.backlogtool.com",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
  });

  it.each(["backlog.example.internal", "backlog.example.co.jp"])(
    "accepts the self-hosted domain %s",
    (host) => {
      const result = v.safeParse(RcSpaceSchema, { host, auth: validAuth });
      expect(result.success).toBe(true);
    },
  );

  it("normalizes an uppercase host to lowercase", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "Example.Backlog.COM",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.host).toBe("example.backlog.com");
    }
  });

  // A host is interpolated into `https://${host}`, so anything that can shift the
  // resulting origin would send the stored credentials to another server.
  it.each([
    ["userinfo that redirects the origin", "example.backlog.com@evil.com"],
    ["a path that redirects the origin", "evil.com/#@example.backlog.com"],
    ["a query that redirects the origin", "evil.com?x=.backlog.com"],
    ["a scheme", "https://example.backlog.com"],
    ["a trailing slash", "example.backlog.com/"],
    ["a path prefix", "backlog.example.internal/backlog"],
    ["a port", "example.backlog.com:8969"],
    ["a space", "exa mple.backlog.com"],
    ["no dot", "backlog"],
    // Not attacks, but shapes a self-hosted user may reasonably try. They are
    // unsupported today rather than deliberately forbidden.
    ["an IP address", "192.168.1.1"],
    ["a trailing dot", "example.backlog.com."],
  ])("rejects a host with %s", (_description, host) => {
    const result = v.safeParse(RcSpaceSchema, { host, auth: validAuth });
    expect(result.success).toBe(false);
  });

  it("rejects empty host", () => {
    const result = v.safeParse(RcSpaceSchema, { host: "", auth: validAuth });
    expect(result.success).toBe(false);
  });
});

describe("RcSchema", () => {
  it("accepts empty config with defaults", () => {
    const result = v.safeParse(RcSchema, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.spaces).toEqual([]);
      expect(result.output.aliases).toEqual({});
      expect(result.output.defaultSpace).toBeUndefined();
    }
  });

  it("normalizes defaultSpace to lowercase so it matches the stored host", () => {
    const result = v.safeParse(RcSchema, {
      defaultSpace: "Example.Backlog.COM",
      spaces: [{ host: "Example.Backlog.COM", auth: { method: "api-key", apiKey: "key" } }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.defaultSpace).toBe("example.backlog.com");
      expect(result.output.spaces[0]?.host).toBe("example.backlog.com");
    }
  });

  it("accepts config with defaultSpace", () => {
    const result = v.safeParse(RcSchema, {
      defaultSpace: "example.backlog.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.defaultSpace).toBe("example.backlog.com");
    }
  });

  it("accepts config with spaces", () => {
    const result = v.safeParse(RcSchema, {
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key", apiKey: "key" },
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.spaces).toHaveLength(1);
    }
  });

  it("rejects invalid space in spaces array", () => {
    const result = v.safeParse(RcSchema, {
      spaces: [{ host: "invalid", auth: { method: "api-key", apiKey: "key" } }],
    });
    expect(result.success).toBe(false);
  });
});
