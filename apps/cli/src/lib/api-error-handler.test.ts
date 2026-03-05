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

describe("handleBacklogApiError", () => {
  it("returns false for non-Backlog error objects", () => {
    expect(handleBacklogApiError(new Error("something"), { json: false })).toBe(false);
    expect(handleBacklogApiError("string", { json: false })).toBe(false);
    expect(handleBacklogApiError(null, { json: false })).toBe(false);
    expect(handleBacklogApiError({}, { json: false })).toBe(false);
  });

  it("returns true and logs formatted error for Backlog API error", () => {
    const error = {
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    };

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("NoResourceError: No such project.");
  });

  it("logs each error for multiple errors", () => {
    const error = {
      errors: [
        { message: "Invalid param.", code: 7, moreInfo: "" },
        { message: "Name is required.", code: 7, moreInfo: "name" },
      ],
    };

    expect(handleBacklogApiError(error, { json: false })).toBe(true);
    expect(consola.error).toHaveBeenCalledWith("InvalidRequestError: Invalid param.");
    expect(consola.error).toHaveBeenCalledWith("InvalidRequestError: Name is required. (name)");
  });

  it("outputs raw JSON to stderr when json is true", () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const error = {
      errors: [{ message: "No such project.", code: 6, moreInfo: "" }],
    };

    expect(handleBacklogApiError(error, { json: true })).toBe(true);
    expect(consola.error).not.toHaveBeenCalled();
    expect(stderrWrite).toHaveBeenCalledWith(`${JSON.stringify(error)}\n`);

    stderrWrite.mockRestore();
  });
});
