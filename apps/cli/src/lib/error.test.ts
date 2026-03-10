import { CommanderError } from "commander";
import consola from "consola";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserError } from "@repo/cli-utils";
import { handleError } from "./error";

const mockConsola = vi.hoisted(() => ({
  error: vi.fn(),
  debug: vi.fn(),
  level: 0,
}));

vi.mock("consola", () => ({
  default: mockConsola,
  LogLevels: { debug: 4 },
}));

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  handleBacklogApiError: vi.fn(() => false),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  handleValidationError: vi.fn(() => false),
}));

let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetAllMocks();
  exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

afterEach(() => {
  exitSpy.mockRestore();
});

describe("handleError", () => {
  it("returns silently for CommanderError with exitCode 0", () => {
    handleError(new CommanderError(0, "commander.helpDisplayed", ""));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits with exitCode for CommanderError with non-zero exitCode", () => {
    handleError(new CommanderError(1, "commander.missingArgument", "missing arg"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("logs UserError message without stack trace", () => {
    handleError(new UserError("Invalid input"));
    expect(consola.error).toHaveBeenCalledWith("Invalid input");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("delegates Backlog API errors to handleBacklogApiError", async () => {
    const { handleBacklogApiError } = await import("@repo/backlog-utils");
    vi.mocked(handleBacklogApiError).mockReturnValue(true);

    const backlogError = new Error("API error");
    handleError(backlogError);

    expect(handleBacklogApiError).toHaveBeenCalledWith(
      backlogError,
      expect.objectContaining({ json: expect.any(Boolean) }),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("falls through to generic error log when not Backlog or validation error", () => {
    const error = new Error("Network failure");
    handleError(error);

    expect(consola.error).toHaveBeenCalledWith(error);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
