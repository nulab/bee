import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { RcAuthSchema, RcSchema, RcSpaceSchema } from "#src/schema.js";

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

  it("rejects invalid host domain", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "example.invalid.com",
      auth: validAuth,
    });
    expect(result.success).toBe(false);
  });

  it("rejects host with uppercase letters", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "Example.backlog.com",
      auth: validAuth,
    });
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
