import { describe, expect, test, vi, beforeEach } from "vitest";
import consola from "consola";
import {
  formatBacklogError,
  handleBacklogApiError,
  isBacklogErrorResponse,
  errorCodeName,
} from "./api-error";

vi.mock("consola", () => ({
  default: {
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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

type ErrorBody = { errors: { message: string; code: number; moreInfo: string }[] };

/**
 * Creates a mock backlog-js BacklogApiError.
 * backlog-js compiles to ES5 with `_name` and `_body` private fields,
 * so we replicate that structure for testing.
 */
const createBacklogApiError = (body: ErrorBody) => {
  const error = new Error("BacklogApiError");
  Object.assign(error, { _name: "BacklogApiError", _body: body });
  return error;
};

const createBacklogAuthError = (body: ErrorBody) => {
  const error = new Error("BacklogAuthError");
  Object.assign(error, { _name: "BacklogAuthError", _body: body });
  return error;
};

describe("handleBacklogApiError", () => {
  test("returns false for non-Backlog error objects", () => {
    expect(handleBacklogApiError(new Error("something"), { json: false })).toBe(false);
    expect(handleBacklogApiError("string", { json: false })).toBe(false);
    expect(handleBacklogApiError(null, { json: false })).toBe(false);
    expect(handleBacklogApiError({}, { json: false })).toBe(false);
  });

  test("returns true and logs formatted error for plain error body", () => {
    const error = {
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    };

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("NoResourceError: No such project.");
  });

  test("handles BacklogApiError instances", () => {
    const error = createBacklogApiError({
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    });

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("NoResourceError: No such project.");
  });

  test("handles BacklogAuthError instances", () => {
    const error = createBacklogAuthError({
      errors: [{ message: "Authentication failed.", code: 11, moreInfo: "" }],
    });

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("AuthenticationError: Authentication failed.");
  });

  test("logs each error for multiple errors", () => {
    const error = createBacklogApiError({
      errors: [
        { message: "Invalid param.", code: 7, moreInfo: "" },
        { message: "Name is required.", code: 7, moreInfo: "name" },
      ],
    });

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("InvalidRequestError: Invalid param.");
    expect(consola.error).toHaveBeenCalledWith("InvalidRequestError: Name is required. (name)");
  });

  test("outputs raw JSON to stderr when json is true", () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const body = {
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    };
    const error = createBacklogApiError(body);

    expect(handleBacklogApiError(error, { json: true })).toBe(true);
    expect(consola.error).not.toHaveBeenCalled();
    expect(stderrWrite).toHaveBeenCalledWith(`${JSON.stringify(body)}\n`);

    stderrWrite.mockRestore();
  });
});
