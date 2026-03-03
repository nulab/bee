import { describe, expect, it, vi } from "vitest";
import { BacklogRateLimitError } from "#/rate-limit.ts";

vi.mock("ofetch", () => {
  const createMock = vi.fn((defaults: Record<string, unknown>) => defaults);
  return {
    ofetch: { create: createMock },
  };
});

vi.mock("ufo", () => ({
  joinURL: (...parts: string[]) => parts.join(""),
}));

// eslint-disable-next-line import/first -- must follow vi.mock calls
import { createClient } from "#/client.ts";

describe("createClient", () => {
  it("sets baseURL from host", () => {
    const result = createClient({
      host: "example.backlog.com",
    }) as unknown as Record<string, unknown>;

    expect(result.baseURL).toBe("https://example.backlog.com/api/v2");
  });

  it("sets apiKey as query param for API Key auth", () => {
    const result = createClient({
      host: "example.backlog.com",
      apiKey: "test-key",
    }) as unknown as Record<string, unknown>;

    expect(result.query).toEqual({ apiKey: "test-key" });
    expect(result.headers).toEqual({});
  });

  it("sets Authorization header for OAuth auth", () => {
    const result = createClient({
      host: "example.backlog.com",
      accessToken: "test-token",
    }) as unknown as Record<string, unknown>;

    expect(result.headers).toEqual({
      Authorization: "Bearer test-token",
    });
    expect(result.query).toEqual({});
  });

  it("throws BacklogRateLimitError on 429 with reset header", () => {
    const resetEpoch = "1700000000";
    const result = createClient({
      host: "example.backlog.com",
    }) as unknown as Record<string, unknown>;
    const onResponseError = result.onResponseError as (ctx: {
      response: { status: number; headers: Map<string, string> };
    }) => void;

    const headers = new Map([["X-RateLimit-Reset", resetEpoch]]);

    expect(() => {
      onResponseError({
        response: {
          status: 429,
          headers: headers as unknown as Map<string, string>,
        },
      });
    }).toThrow(BacklogRateLimitError);
  });

  it("throws BacklogRateLimitError on 429 without reset header", () => {
    const result = createClient({
      host: "example.backlog.com",
    }) as unknown as Record<string, unknown>;
    const onResponseError = result.onResponseError as (ctx: {
      response: { status: number; headers: Map<string, string> };
    }) => void;

    const headers = new Map<string, string>();

    expect(() => {
      onResponseError({
        response: {
          status: 429,
          headers: headers as unknown as Map<string, string>,
        },
      });
    }).toThrow(BacklogRateLimitError);
  });

  it("includes resetAt in BacklogRateLimitError when header present", () => {
    const resetEpoch = "1700000000";
    const result = createClient({
      host: "example.backlog.com",
    }) as unknown as Record<string, unknown>;
    const onResponseError = result.onResponseError as (ctx: {
      response: { status: number; headers: Map<string, string> };
    }) => void;

    const headers = new Map([["X-RateLimit-Reset", resetEpoch]]);

    try {
      onResponseError({
        response: {
          status: 429,
          headers: headers as unknown as Map<string, string>,
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(BacklogRateLimitError);
      expect((error as BacklogRateLimitError).resetAt).toEqual(new Date(Number(resetEpoch) * 1000));
    }
  });

  it("does not throw for non-429 responses", () => {
    const result = createClient({
      host: "example.backlog.com",
    }) as unknown as Record<string, unknown>;
    const onResponseError = result.onResponseError as (ctx: {
      response: { status: number; headers: Map<string, string> };
    }) => void;

    const headers = new Map<string, string>();

    expect(() => {
      onResponseError({
        response: {
          status: 500,
          headers: headers as unknown as Map<string, string>,
        },
      });
    }).not.toThrow();
  });
});
