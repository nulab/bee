import { loadConfig, removeSpace } from "@repo/config";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
  loadConfig: vi.fn(),
  removeSpace: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("auth logout", () => {
  it("logs out from specified host", async () => {
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

    const { default: logout } = await import("./logout");
    await logout.parseAsync(["--space", "example.backlog.com"], { from: "user" });

    expect(removeSpace).toHaveBeenCalledWith("example.backlog.com");
    expect(consola.success).toHaveBeenCalledWith("Logged out of example.backlog.com.");
  });

  it("shows message when no spaces are configured", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });

    const { default: logout } = await import("./logout");
    await logout.parseAsync([], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No spaces are currently authenticated.");
    expect(removeSpace).not.toHaveBeenCalled();
  });

  it("shows error for non-existent space", async () => {
    vi.mocked(loadConfig).mockReturnValue({
      spaces: [],
      defaultSpace: undefined,
      aliases: {},
    });
    vi.mocked(removeSpace).mockImplementation(() => {
      throw new Error("not found");
    });

    const { default: logout } = await import("./logout");
    await expect(
      logout.parseAsync(["--space", "nonexistent.backlog.com"], { from: "user" }),
    ).rejects.toThrow('Space "nonexistent.backlog.com" is not configured.');
  });

  it("auto-selects and logs out when --space is omitted and one space exists", async () => {
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

    const { default: logout } = await import("./logout");
    await logout.parseAsync([], { from: "user" });

    expect(removeSpace).toHaveBeenCalledWith("only.backlog.com");
    expect(consola.success).toHaveBeenCalledWith("Logged out of only.backlog.com.");
  });
});
