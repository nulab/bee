import { mkdirSync } from "node:fs";
import { read, write } from "rc9";
import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  mkdirSync: vi.fn(),
}));

vi.mock("rc9", () => ({
  read: vi.fn(),
  write: vi.fn(),
}));

// Must import after mock setup
const { loadConfig, writeConfig } = await import("./config");

const mockRead = vi.mocked(read);
const mockWrite = vi.mocked(write);

describe("loadConfig", () => {
  it("returns validated config when rc file is valid", () => {
    mockRead.mockReturnValue({
      defaultSpace: "example.backlog.com",
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key", apiKey: "abc123" },
        },
      ],
    });

    const config = loadConfig();

    expect(mockRead).toHaveBeenCalledWith(expect.objectContaining({ name: ".backlogrc" }));
    expect(config.defaultSpace).toBe("example.backlog.com");
    expect(config.spaces).toHaveLength(1);
    expect(config.spaces[0]?.host).toBe("example.backlog.com");
  });

  it("returns empty spaces array when rc file is empty", () => {
    mockRead.mockReturnValue({});

    const config = loadConfig();

    expect(config.spaces).toEqual([]);
    expect(config.defaultSpace).toBeUndefined();
  });

  it("exits process when config validation fails", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    mockRead.mockReturnValue({
      spaces: [{ host: "invalid", auth: { method: "bad" } }],
    });

    loadConfig();

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});

describe("writeConfig", () => {
  it("creates config directory before writing", () => {
    const config = {
      defaultSpace: "example.backlog.com",
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key" as const, apiKey: "abc123" },
        },
      ],
      aliases: {} as Record<string, string>,
    };

    writeConfig(config);

    expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining("backlog"), { recursive: true });
    expect(mockWrite).toHaveBeenCalledWith(config, expect.objectContaining({ name: ".backlogrc" }));
  });
});
