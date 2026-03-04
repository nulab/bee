import { loadConfig, removeSpace } from "@repo/config";
import { spyOnProcessExit } from "@repo/test-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
  loadConfig: vi.fn(),
  removeSpace: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth logout", () => {
  it("指定ホストをログアウトする", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key" as const, apiKey: "key" },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });

    const { logout } = await import("#/commands/auth/logout.js");
    await logout.run?.({
      args: { space: "example.backlog.com" },
    } as never);

    expect(removeSpace).toHaveBeenCalledWith("example.backlog.com");
    expect(consola.success).toHaveBeenCalledWith("Logged out of example.backlog.com.");
  });

  it("スペースが0件の場合メッセージを表示する", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });

    const { logout } = await import("#/commands/auth/logout.js");
    await logout.run?.({
      args: {},
    } as never);

    expect(consola.info).toHaveBeenCalledWith("No spaces are currently authenticated.");
    expect(removeSpace).not.toHaveBeenCalled();
  });

  it("存在しないスペースでエラーを出す", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });
    vi.mocked(removeSpace).mockImplementation(() => {
      throw new Error("not found");
    });

    const exitSpy = spyOnProcessExit();

    const { logout } = await import("#/commands/auth/logout.js");
    await logout.run?.({
      args: { space: "nonexistent.backlog.com" },
    } as never);

    expect(consola.error).toHaveBeenCalledWith(
      'Space "nonexistent.backlog.com" is not configured.',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("--space 省略で1件の場合、自動選択してログアウトする", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "only.backlog.com",
          auth: { method: "api-key" as const, apiKey: "key" },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });
    vi.mocked(removeSpace).mockImplementation(() => {});

    const { logout } = await import("#/commands/auth/logout.js");
    await logout.run?.({
      args: {},
    } as never);

    expect(removeSpace).toHaveBeenCalledWith("only.backlog.com");
    expect(consola.success).toHaveBeenCalledWith("Logged out of only.backlog.com.");
  });
});
