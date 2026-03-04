import { loadConfig, writeConfig } from "@repo/config";
import { spyOnProcessExit } from "@repo/test-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
  loadConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth switch", () => {
  it("switches to specified host", async () => {
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

    const { switchSpace } = await import("#src/commands/auth/switch.js");
    await switchSpace.run?.({
      args: { space: "example.backlog.com" },
    } as never);

    expect(writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSpace: "example.backlog.com",
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Switched active space to example.backlog.com.");
  });

  it("shows error when space is not found", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });

    const exitSpy = spyOnProcessExit();

    const { switchSpace } = await import("#src/commands/auth/switch.js");
    await switchSpace.run?.({
      args: { space: "missing.backlog.com" },
    } as never);

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("calls writeConfig on successful switch", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [
        {
          host: "target.backlog.com",
          auth: { method: "api-key" as const, apiKey: "key" },
        },
      ],
      defaultSpace: undefined,
      aliases: {},
    });

    const { switchSpace } = await import("#src/commands/auth/switch.js");
    await switchSpace.run?.({
      args: { space: "target.backlog.com" },
    } as never);

    expect(writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSpace: "target.backlog.com",
      }),
    );
  });
});
