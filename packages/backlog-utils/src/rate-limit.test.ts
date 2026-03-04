import { describe, expect, it } from "vitest";
import { BacklogRateLimitError, formatResetTime } from "#/rate-limit.js";

describe("formatResetTime", () => {
  it("converts epoch seconds to a localized date-time string", () => {
    const epoch = 1_700_000_000;
    const result = formatResetTime(epoch);

    expect(result).toBe(new Date(epoch * 1000).toLocaleString());
  });
});

describe("BacklogRateLimitError", () => {
  it("has the correct error name", () => {
    const error = new BacklogRateLimitError("rate limited");

    expect(error.name).toBe("BacklogRateLimitError");
  });

  it("stores the message", () => {
    const error = new BacklogRateLimitError("rate limited");

    expect(error.message).toBe("rate limited");
  });

  it("stores resetAt when provided", () => {
    const resetAt = new Date("2025-01-01T00:00:00Z");
    const error = new BacklogRateLimitError("rate limited", resetAt);

    expect(error.resetAt).toBe(resetAt);
  });

  it("has undefined resetAt when not provided", () => {
    const error = new BacklogRateLimitError("rate limited");

    expect(error.resetAt).toBeUndefined();
  });

  it("is an instance of Error", () => {
    const error = new BacklogRateLimitError("rate limited");

    expect(error).toBeInstanceOf(Error);
  });

  it("is an instance of BacklogRateLimitError", () => {
    const error = new BacklogRateLimitError("rate limited");

    expect(error).toBeInstanceOf(BacklogRateLimitError);
  });
});
