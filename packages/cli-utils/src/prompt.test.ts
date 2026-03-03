import { spyOnProcessExit } from "@repo/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import consola from "consola";
import { confirmOrExit, promptRequired } from "#/prompt.js";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("promptRequired", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env["BACKLOG_NO_INPUT"];
  });

  it("既存の値がある場合はそのまま返す", async () => {
    const result = await promptRequired("Label:", "existing-value");
    expect(result).toBe("existing-value");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("既存の値がない場合はプロンプトを表示する", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalledWith("Label:", { type: "text" });
    expect(result).toBe("user-input");
  });

  it("既存の値が undefined の場合はプロンプトを表示する", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("prompted" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBe("prompted");
  });

  it("プロンプトで空文字が入力された場合は process.exit(1) を呼ぶ", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("" as never);
    const mockExit = spyOnProcessExit();

    await promptRequired("Label:");

    expect(consola.error).toHaveBeenCalledWith("Label is required.");
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it("options が consola.prompt に渡される", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:", undefined, { placeholder: "xxx.backlog.com" });
    expect(consola.prompt).toHaveBeenCalledWith("Label:", {
      type: "text",
      placeholder: "xxx.backlog.com",
    });
    expect(result).toBe("user-input");
  });

  it("options が未指定の場合は type: text のみ渡される", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("user-input" as never);

    const result = await promptRequired("Label:");
    expect(consola.prompt).toHaveBeenCalledWith("Label:", { type: "text" });
    expect(result).toBe("user-input");
  });

  it("ラベル末尾のコロンを除去してエラーメッセージを生成する", async () => {
    vi.mocked(consola.prompt).mockResolvedValue("" as never);
    const mockExit = spyOnProcessExit();

    await promptRequired("Project key:");

    expect(consola.error).toHaveBeenCalledWith("Project key is required.");
    mockExit.mockRestore();
  });

  it("--no-input モードで既存の値がある場合はそのまま返す", async () => {
    process.env["BACKLOG_NO_INPUT"] = "1";

    const result = await promptRequired("Label:", "existing-value");
    expect(result).toBe("existing-value");
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("--no-input モードで値が未指定の場合はエラーで終了する", async () => {
    process.env["BACKLOG_NO_INPUT"] = "1";
    const mockExit = spyOnProcessExit();

    await promptRequired("Project key:");

    expect(consola.error).toHaveBeenCalledWith(
      "Project key is required. Use arguments to provide it in --no-input mode.",
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
    delete process.env["BACKLOG_NO_INPUT"];
  });

  it("skipConfirm が true の場合、プロンプトを表示せず true を返す", async () => {
    const result = await confirmOrExit("Are you sure?", true);
    expect(result).toBeTruthy();
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("ユーザーが確認した場合、true を返す", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalledWith("Are you sure?", { type: "confirm" });
    expect(result).toBeTruthy();
  });

  it("ユーザーがキャンセルした場合、false を返し Cancelled. を表示する", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(false as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalledWith("Are you sure?", { type: "confirm" });
    expect(consola.info).toHaveBeenCalledWith("Cancelled.");
    expect(result).toBeFalsy();
  });

  it("skipConfirm が undefined の場合、プロンプトを表示する", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?");
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("skipConfirm が false の場合、プロンプトを表示する", async () => {
    vi.mocked(consola.prompt).mockResolvedValue(true as never);

    const result = await confirmOrExit("Are you sure?", false);
    expect(consola.prompt).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("--no-input モードで skipConfirm が true の場合はプロンプトなしで true を返す", async () => {
    process.env["BACKLOG_NO_INPUT"] = "1";

    const result = await confirmOrExit("Are you sure?", true);
    expect(result).toBeTruthy();
    expect(consola.prompt).not.toHaveBeenCalled();
  });

  it("--no-input モードで skipConfirm が未指定の場合はエラーで終了する", async () => {
    process.env["BACKLOG_NO_INPUT"] = "1";
    const mockExit = spyOnProcessExit();

    await confirmOrExit("Are you sure?");

    expect(consola.error).toHaveBeenCalledWith(
      "Confirmation required. Use --yes to skip in --no-input mode.",
    );
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(consola.prompt).not.toHaveBeenCalled();
    mockExit.mockRestore();
  });
});
