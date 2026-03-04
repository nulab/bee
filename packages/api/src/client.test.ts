import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BacklogRateLimitError } from "#src/rate-limit.js";

const { mockFetch, mockCreate } = vi.hoisted(() => {
  const fetch = vi.fn();
  const create = vi.fn((_defaults: Record<string, unknown>) => fetch);
  return { mockFetch: fetch, mockCreate: create };
});

vi.mock("ofetch", () => ({
  ofetch: { create: mockCreate },
}));

vi.mock("ufo", () => ({
  joinURL: (...parts: string[]) => parts.join(""),
}));

vi.mock("node:timers/promises", () => ({
  setTimeout: (ms: number) =>
    new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, ms);
    }),
}));

// eslint-disable-next-line import/first -- must follow vi.mock calls
import { createClient } from "#src/client.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createClient", () => {
  describe("configuration", () => {
    it("sets baseURL from host", () => {
      createClient({ host: "example.backlog.com" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "https://example.backlog.com/api/v2",
        }),
      );
    });

    it("sets apiKey as query param for API Key auth", () => {
      createClient({ host: "example.backlog.com", apiKey: "test-key" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { apiKey: "test-key" },
        }),
      );
    });

    it("sets Authorization header for static accessToken", () => {
      createClient({ host: "example.backlog.com", accessToken: "test-token" });

      const callArgs = mockCreate.mock.calls.at(-1)?.[0] as Record<string, unknown>;
      expect(callArgs.headers).toEqual({ Authorization: "Bearer test-token" });
    });

    it("sets Authorization header via getter for function accessToken", () => {
      let token = "token-v1";
      createClient({ host: "example.backlog.com", accessToken: () => token });

      const callArgs = mockCreate.mock.calls.at(-1)?.[0] as Record<string, unknown>;
      const headers = callArgs.headers as Record<string, string>;

      expect(headers.Authorization).toBe("Bearer token-v1");

      token = "token-v2";
      expect(headers.Authorization).toBe("Bearer token-v2");
    });
  });

  describe("429 error handling (onResponseError)", () => {
    const getOnResponseError = () => {
      createClient({ host: "example.backlog.com", rateLimitRetry: false });
      const callArgs = mockCreate.mock.calls.at(-1)?.[0] as Record<string, unknown>;
      return callArgs.onResponseError as (ctx: {
        response: { status: number; headers: Map<string, string> };
      }) => void;
    };

    it("throws BacklogRateLimitError on 429 with reset header", () => {
      const onResponseError = getOnResponseError();
      const headers = new Map([["X-RateLimit-Reset", "1700000000"]]);

      expect(() => {
        onResponseError({
          response: { status: 429, headers: headers as unknown as Map<string, string> },
        });
      }).toThrow(BacklogRateLimitError);
    });

    it("throws BacklogRateLimitError on 429 without reset header", () => {
      const onResponseError = getOnResponseError();
      const headers = new Map<string, string>();

      expect(() => {
        onResponseError({
          response: { status: 429, headers: headers as unknown as Map<string, string> },
        });
      }).toThrow(BacklogRateLimitError);
    });

    it("includes resetAt in error when header present", () => {
      const onResponseError = getOnResponseError();
      const headers = new Map([["X-RateLimit-Reset", "1700000000"]]);

      try {
        onResponseError({
          response: { status: 429, headers: headers as unknown as Map<string, string> },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BacklogRateLimitError);
        expect((error as BacklogRateLimitError).resetAt).toEqual(new Date(1_700_000_000 * 1000));
      }
    });

    it("does not throw for non-429 responses", () => {
      const onResponseError = getOnResponseError();
      const headers = new Map<string, string>();

      expect(() => {
        onResponseError({
          response: { status: 500, headers: headers as unknown as Map<string, string> },
        });
      }).not.toThrow();
    });
  });

  describe("rate limit retry", () => {
    it("retries after waiting when resetAt is within 60s (default: rateLimitRetry=true)", async () => {
      const now = Date.now();
      const resetAt = new Date(now + 5000);
      const rateLimitError = new BacklogRateLimitError("rate limited", resetAt);

      mockFetch.mockRejectedValueOnce(rateLimitError).mockResolvedValueOnce({ ok: true });

      const client = createClient({ host: "example.backlog.com" });
      const resultPromise = client("/test");

      await vi.advanceTimersByTimeAsync(5000 + 1000);

      await expect(resultPromise).resolves.toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws if retry also fails with 429", async () => {
      const now = Date.now();
      const resetAt = new Date(now + 5000);
      const rateLimitError = new BacklogRateLimitError("rate limited", resetAt);

      mockFetch.mockRejectedValueOnce(rateLimitError).mockRejectedValueOnce(rateLimitError);

      const client = createClient({ host: "example.backlog.com" });
      const resultPromise = client("/test");

      // Attach rejection handler before advancing timers to avoid unhandled rejection
      const assertion = expect(resultPromise).rejects.toThrow(BacklogRateLimitError);

      await vi.advanceTimersByTimeAsync(5000 + 1000);

      await assertion;
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("does not retry when rateLimitRetry is false", async () => {
      const now = Date.now();
      const resetAt = new Date(now + 5000);
      const rateLimitError = new BacklogRateLimitError("rate limited", resetAt);

      mockFetch.mockRejectedValueOnce(rateLimitError);

      const client = createClient({
        host: "example.backlog.com",
        rateLimitRetry: false,
      });

      await expect(client("/test")).rejects.toThrow(BacklogRateLimitError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry when resetAt exceeds 60s", async () => {
      const now = Date.now();
      const resetAt = new Date(now + 120_000);
      const rateLimitError = new BacklogRateLimitError("rate limited", resetAt);

      mockFetch.mockRejectedValueOnce(rateLimitError);

      const client = createClient({ host: "example.backlog.com" });

      await expect(client("/test")).rejects.toThrow(BacklogRateLimitError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry when resetAt is undefined", async () => {
      const rateLimitError = new BacklogRateLimitError("rate limited");

      mockFetch.mockRejectedValueOnce(rateLimitError);

      const client = createClient({ host: "example.backlog.com" });

      await expect(client("/test")).rejects.toThrow(BacklogRateLimitError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry when resetAt is in the past", async () => {
      const now = Date.now();
      const resetAt = new Date(now - 5000);
      const rateLimitError = new BacklogRateLimitError("rate limited", resetAt);

      mockFetch.mockRejectedValueOnce(rateLimitError);

      const client = createClient({ host: "example.backlog.com" });

      await expect(client("/test")).rejects.toThrow(BacklogRateLimitError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry non-rate-limit errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network error"));

      const client = createClient({ host: "example.backlog.com" });

      await expect(client("/test")).rejects.toThrow("network error");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
