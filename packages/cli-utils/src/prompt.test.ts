import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import consola from "consola";
import { confirmOrExit, promptRequired } from "./prompt";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("promptRequired", () => {
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalIsTTY = process.stdin.isTTY;
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: originalIsTTY, writable: true });
  });

  it("returns existing value without prompting", async () => {
    const result = await promptRequired("Label:", "existing-value");
    expect(result).toBe("existing-value");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("throws error when existing value is an empty string", async () => {
    await expect(promptRequired("Label:", "")).rejects.toThrow("Label is required.");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("shows prompt when no existing value is provided", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalledWith("Label:", { type: "text" });
    expect(result).toBe("user-input");
  });

  it("shows prompt when existing value is undefined", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue("prompted" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBe("prompted");
  });

  it("throws error when prompt input is empty", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue("" as never);

    await expect(promptRequired("Label:")).rejects.toThrow("Label is required.");
  });

  it("passes options to consola.prompt", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:", undefined, { placeholder: "xxx.backlog.com" });
    expect(consola.prompt).toHaveBeenCalledWith("Label:", {
      type: "text",
      placeholder: "xxx.backlog.com",
    });
    expect(result).toBe("user-input");
  });

  it("appends valueHint to prompt label when provided", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue("high" as never);

    const result = await promptRequired("Priority:", undefined, {
      valueHint: "{high|normal|low}",
    });
    expect(consola.prompt).toHaveBeenCalledWith("Priority {high|normal|low}:", { type: "text" });
    expect(result).toBe("high");
  });

  it("passes only type: text when options are not specified", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalledWith("Label:", { type: "text" });
    expect(result).toBe("user-input");
  });

  it("strips trailing colon from label for error message", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue("" as never);

    await expect(promptRequired("Project key:")).rejects.toThrow("Project key is required.");
  });

  it("returns existing value without prompting in non-interactive mode", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: undefined, writable: true });

    const result = await promptRequired("Label:", "existing-value");
    expect(result).toBe("existing-value");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("throws error when value is missing in non-interactive mode", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: undefined, writable: true });

    await expect(promptRequired("Project key:")).rejects.toThrow(
      "Project key is required. Use arguments to provide it in non-interactive mode.",
    );
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("throws UserError instance for empty string existing value", async () => {
    const { UserError } = await import("./user-error");
    await expect(promptRequired("Label:", "")).rejects.toBeInstanceOf(UserError);
  });

  it("returns whitespace-only existing value without prompting", async () => {
    const result = await promptRequired("Label:", "  ");
    expect(result).toBe("  ");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("strips trailing colon from label in error for empty existing value", async () => {
    await expect(promptRequired("Project key:", "")).rejects.toThrow("Project key is required.");
  });

  it("throws UserError instance in non-interactive mode", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: undefined, writable: true });
    const { UserError } = await import("./user-error");
    await expect(promptRequired("Label:")).rejects.toBeInstanceOf(UserError);
  });

  it("throws UserError when prompt returns non-string (e.g. symbol from cancellation)", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue(Symbol("cancel") as never);

    const { UserError } = await import("./user-error");
    await expect(promptRequired("Label:")).rejects.toBeInstanceOf(UserError);
  });
});

describe("confirmOrExit", () => {
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalIsTTY = process.stdin.isTTY;
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: originalIsTTY, writable: true });
  });

  it("returns true without prompting when skipConfirm is true", async () => {
    const result = await confirmOrExit("Are you sure?", true);
    expect(result).toBeTruthy();
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("returns true when user confirms", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalledWith("Are you sure?", { type: "confirm" });
    expect(result).toBeTruthy();
  });

  it("returns false and shows Cancelled. when user declines", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue(false as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalledWith("Are you sure?", { type: "confirm" });
    expect(consola.info).toHaveBeenCalledWith("Cancelled.");
    expect(result).toBeFalsy();
  });

  it("shows prompt when skipConfirm is undefined", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("shows prompt when skipConfirm is false", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?", false);
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("returns true without prompting when skipConfirm is true in non-interactive mode", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: undefined, writable: true });

    const result = await confirmOrExit("Are you sure?", true);
    expect(result).toBeTruthy();
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("throws error when skipConfirm is not specified in non-interactive mode", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: undefined, writable: true });

    await expect(confirmOrExit("Are you sure?")).rejects.toThrow(
      "Confirmation required. Use --yes to skip in non-interactive mode.",
    );
    expect(consola.prompt).not.toHaveBeenCalled();
  });
});
