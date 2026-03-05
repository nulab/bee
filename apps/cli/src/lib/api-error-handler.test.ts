import { describe, expect, it, vi, beforeEach } from "vitest";
import consola from "consola";
import { handleBacklogApiError } from "./api-error-handler";

vi.mock("consola", () => ({
  default: {
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
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
  it("returns false for non-Backlog error objects", () => {
    expect(handleBacklogApiError(new Error("something"), { json: false })).toBe(false);
    expect(handleBacklogApiError("string", { json: false })).toBe(false);
    expect(handleBacklogApiError(null, { json: false })).toBe(false);
    expect(handleBacklogApiError({}, { json: false })).toBe(false);
  });

  it("returns true and logs formatted error for plain error body", () => {
    const error = {
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    };

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("NoResourceError: No such project.");
  });

  it("handles BacklogApiError instances", () => {
    const error = createBacklogApiError({
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    });

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("NoResourceError: No such project.");
  });

  it("handles BacklogAuthError instances", () => {
    const error = createBacklogAuthError({
      errors: [{ message: "Authentication failed.", code: 11, moreInfo: "" }],
    });

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("AuthenticationError: Authentication failed.");
  });

  it("logs each error for multiple errors", () => {
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

  it("outputs raw JSON to stderr when json is true", () => {
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
