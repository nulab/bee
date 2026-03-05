import { spyOnProcessExit } from "@repo/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import consola from "consola";
import { confirmOrExit, promptRequired } from "./prompt";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("promptRequired", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.BACKLOG_NO_INPUT;
  });

  it("returns existing value without prompting", async () => {
    const result = await promptRequired("Label:", "existing-value");
    expect(result).toBe("existing-value");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("exits with error when existing value is an empty string", async () => {
    const mockExit = spyOnProcessExit();

    await promptRequired("Label:", "");

    expect(consola.error).toHaveBeenCalledWith("Label is required.");
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(consola.prompt).not.toHaveBeenCalled();
    mockExit.mockRestore();
  });

  it("shows prompt when no existing value is provided", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalledWith("Label:", { type: "text" });
    expect(result).toBe("user-input");
  });

  it("shows prompt when existing value is undefined", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("prompted" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBe("prompted");
  });

  it("calls process.exit(1) when prompt input is empty", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("" as never);
    const mockExit = spyOnProcessExit();

    await promptRequired("Label:");

    expect(consola.error).toHaveBeenCalledWith("Label is required.");
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it("passes options to consola.prompt", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:", undefined, { placeholder: "xxx.backlog.com" });
    expect(consola.prompt).toHaveBeenCalledWith("Label:", {
      type: "text",
      placeholder: "xxx.backlog.com",
    });
    expect(result).toBe("user-input");
  });

  it("appends valueHint to prompt label when provided", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("high" as never);

    const result = await promptRequired("Priority:", undefined, {
      valueHint: "{high|normal|low}",
    });
    expect(consola.prompt).toHaveBeenCalledWith("Priority {high|normal|low}:", { type: "text" });
    expect(result).toBe("high");
  });

  it("passes only type: text when options are not specified", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalledWith("Label:", { type: "text" });
    expect(result).toBe("user-input");
  });

  it("strips trailing colon from label for error message", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("" as never);
    const mockExit = spyOnProcessExit();

    await promptRequired("Project key:");

    expect(consola.error).toHaveBeenCalledWith("Project key is required.");
    mockExit.mockRestore();
  });

  it("returns existing value without prompting in --no-input mode", async () => {
    process.env.BACKLOG_NO_INPUT = "1";

    const result = await promptRequired("Label:", "existing-value");
    expect(result).toBe("existing-value");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("exits with error when value is missing in --no-input mode", async () => {
    process.env.BACKLOG_NO_INPUT = "1";
    const mockExit = spyOnProcessExit();

    await promptRequired("Project key:");

    expect(consola.error).toHaveBeenCalledWith(
      "Project key is required. Use arguments to provide it in BACKLOG_NO_INPUT mode.",
    );
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(consola.prompt).not.toHaveBeenCalled();
    mockExit.mockRestore();
  });
});

describe("confirmOrExit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.BACKLOG_NO_INPUT;
  });

  it("returns true without prompting when skipConfirm is true", async () => {
    const result = await confirmOrExit("Are you sure?", true);
    expect(result).toBeTruthy();
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("returns true when user confirms", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalledWith("Are you sure?", { type: "confirm" });
    expect(result).toBeTruthy();
  });

  it("returns false and shows Cancelled. when user declines", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(false as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalledWith("Are you sure?", { type: "confirm" });
    expect(consola.info).toHaveBeenCalledWith("Cancelled.");
    expect(result).toBeFalsy();
  });

  it("shows prompt when skipConfirm is undefined", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("shows prompt when skipConfirm is false", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?", false);
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("returns true without prompting when skipConfirm is true in --no-input mode", async () => {
    process.env.BACKLOG_NO_INPUT = "1";

    const result = await confirmOrExit("Are you sure?", true);
    expect(result).toBeTruthy();
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("exits with error when skipConfirm is not specified in --no-input mode", async () => {
    process.env.BACKLOG_NO_INPUT = "1";
    const mockExit = spyOnProcessExit();

    await confirmOrExit("Are you sure?");

    expect(consola.error).toHaveBeenCalledWith(
      "Confirmation required. Use --yes to skip in BACKLOG_NO_INPUT mode.",
    );
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(consola.prompt).not.toHaveBeenCalled();
    mockExit.mockRestore();
  });
});
