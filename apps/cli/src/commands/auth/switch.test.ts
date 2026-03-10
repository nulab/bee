import { loadConfig, writeConfig } from "@repo/config";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { parseCommand } from "@repo/test-utils";

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

    await parseCommand(() => import("./switch"), ["--space", "example.backlog.com"]);

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

    await expect(
      parseCommand(() => import("./switch"), ["--space", "missing.backlog.com"]),
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

    await parseCommand(() => import("./switch"), ["--space", "target.backlog.com"]);

    expect(writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSpace: "target.backlog.com",
      }),
    );
  });
});
