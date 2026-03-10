import { describe, expect, it } from "vitest";
import { itOutputsJson } from "./stdout";

describe("itOutputsJson", () => {
  it("returns a test function", () => {
    const testFn = itOutputsJson(
      () => import("./stdout") as never,
      ["--json"],
      "expectStdoutContaining",
    );
    expect(typeof testFn).toBe("function");
  });
});
