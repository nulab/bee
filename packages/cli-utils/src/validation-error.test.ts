import { describe, expect, it, vi, beforeEach } from "vitest";
import * as v from "valibot";
import consola from "consola";
import { handleValidationError } from "./validation-error";

vi.mock("consola", () => ({
  default: {
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleValidationError", () => {
  it("returns false for non-ValiError", () => {
    expect(handleValidationError(new Error("something"))).toBe(false);
    expect(consola.error).not.toHaveBeenCalled();
  });

  it("returns false for non-Error values", () => {
    expect(handleValidationError("string error")).toBe(false);
    expect(handleValidationError(null)).toBe(false);
  });

  it("returns true and logs error message for ValiError", () => {
    const schema = v.object({ name: v.string() });
    const result = v.safeParse(schema, { name: 123 });
    if (result.success) {
      throw new Error("Expected validation to fail");
    }
    const valiError = new v.ValiError(result.issues);

    expect(handleValidationError(valiError)).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("API response validation failed.");
  });

  it("logs field-level details via consola.debug", () => {
    const schema = v.object({
      name: v.string(),
      age: v.number(),
    });
    const result = v.safeParse(schema, { name: 123, age: "not a number" });
    if (result.success) {
      throw new Error("Expected validation to fail");
    }
    const valiError = new v.ValiError(result.issues);

    handleValidationError(valiError);

    expect(consola.debug).toHaveBeenCalledWith("Validation details:");
    expect(consola.debug).toHaveBeenCalledWith(expect.stringContaining("name:"));
    expect(consola.debug).toHaveBeenCalledWith(expect.stringContaining("age:"));
  });
});
