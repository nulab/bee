import { loadConfig, writeConfig } from "@repo/config";
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

    const { default: switchSpace } = await import("./switch");
    await switchSpace.parseAsync(["--space", "example.backlog.com"], { from: "user" });

    expect(writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSpace: "example.backlog.com",
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Switched active space to example.backlog.com.");
  });

  it("throws error when space is not found", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });

    const { default: switchSpace } = await import("./switch");
    await expect(
      switchSpace.parseAsync(["--space", "missing.backlog.com"], { from: "user" }),
    ).rejects.toThrow();
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

    const { default: switchSpace } = await import("./switch");
    await switchSpace.parseAsync(["--space", "target.backlog.com"], { from: "user" });

    expect(writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSpace: "target.backlog.com",
      }),
    );
  });
});
