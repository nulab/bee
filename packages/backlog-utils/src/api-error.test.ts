import { describe, expect, test } from "vitest";
import { formatBacklogError, isBacklogErrorResponse, errorCodeName } from "./api-error";

describe("errorCodeName", () => {
  test("returns error name for known code", () => {
    expect(errorCodeName(1)).toBe("InternalError");
    expect(errorCodeName(6)).toBe("NoResourceError");
    expect(errorCodeName(13)).toBe("TooManyRequestsError");
  });

  test("returns undefined for unknown code", () => {
    expect(errorCodeName(0)).toBeUndefined();
    expect(errorCodeName(99)).toBeUndefined();
  });
});

describe("isBacklogErrorResponse", () => {
  test("returns true for valid Backlog error response", () => {
    expect(
      isBacklogErrorResponse({
        errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
      }),
    ).toBe(true);
  });

  test("returns true for multiple errors", () => {
    expect(
      isBacklogErrorResponse({
        errors: [
          { message: "Error 1", code: 7, moreInfo: "" },
          { message: "Error 2", code: 7, moreInfo: "details" },
        ],
      }),
    ).toBe(true);
  });

  test("returns false for non-object values", () => {
    expect(isBacklogErrorResponse(null)).toBe(false);
    expect(isBacklogErrorResponse(undefined)).toBe(false);
    expect(isBacklogErrorResponse("string")).toBe(false);
    expect(isBacklogErrorResponse(42)).toBe(false);
  });

  test("returns false for objects without errors array", () => {
    expect(isBacklogErrorResponse({})).toBe(false);
    expect(isBacklogErrorResponse({ errors: "not array" })).toBe(false);
    expect(isBacklogErrorResponse({ errors: [] })).toBe(false);
  });

  test("returns false for errors with missing fields", () => {
    expect(isBacklogErrorResponse({ errors: [{ message: "hi" }] })).toBe(false);
    expect(isBacklogErrorResponse({ errors: [{ code: 1 }] })).toBe(false);
  });
});

describe("formatBacklogError", () => {
  test("formats error with known code and no moreInfo", () => {
    const result = formatBacklogError({
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    });
    expect(result).toEqual(["NoResourceError: No such project."]);
  });

  test("formats error with moreInfo", () => {
    const result = formatBacklogError({
      errors: [
        {
          message: "No such project.",
          code: 6,
          moreInfo: "https://example.com/docs",
        },
      ],
    });
    expect(result).toEqual(["NoResourceError: No such project. (https://example.com/docs)"]);
  });

  test("formats multiple errors", () => {
    const result = formatBacklogError({
      errors: [
        { message: "Invalid param.", code: 7, moreInfo: "" },
        { message: "Name is required.", code: 7, moreInfo: "name" },
      ],
    });
    expect(result).toEqual([
      "InvalidRequestError: Invalid param.",
      "InvalidRequestError: Name is required. (name)",
    ]);
  });

  test("formats error with unknown code", () => {
    const result = formatBacklogError({
      errors: [{ message: "Something broke.", code: 999, moreInfo: "" }],
    });
    expect(result).toEqual(["UnknownError: Something broke."]);
  });
});
