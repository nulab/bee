import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { read, write } from "rc9";
import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  existsSync: vi.fn().mockReturnValue(false),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn(),
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

const mockExistsSync = vi.mocked(existsSync);
const mockStatSync = vi.mocked(statSync);
const mockUnlinkSync = vi.mocked(unlinkSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

const sampleConfig = {
  defaultSpace: "example.backlog.com",
  spaces: [
    {
      host: "example.backlog.com",
      auth: { method: "api-key" as const, apiKey: "abc123" },
    },
  ],
  aliases: {} as Record<string, string>,
};

describe("writeConfig", () => {
  it("creates config directory before writing", () => {
    mockExistsSync.mockReturnValue(false);

    writeConfig(sampleConfig);

    expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining("backlog"), { recursive: true });
    expect(mockWrite).toHaveBeenCalledWith(
      sampleConfig,
      expect.objectContaining({ name: ".backlogrc" }),
    );
  });

  it("migrates conflicting file into config directory", () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ isDirectory: () => false } as ReturnType<typeof statSync>);
    mockReadFileSync.mockReturnValue('spaces.0.host="example.backlog.com"');

    writeConfig(sampleConfig);

    expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining("backlog"), "utf8");
    expect(mockUnlinkSync).toHaveBeenCalledWith(expect.stringContaining("backlog"));
    expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining("backlog"), { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".backlogrc"),
      'spaces.0.host="example.backlog.com"',
      "utf8",
    );
  });

  it("skips migration when path is already a directory", () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ isDirectory: () => true } as ReturnType<typeof statSync>);

    writeConfig(sampleConfig);

    expect(mockUnlinkSync).not.toHaveBeenCalled();
    expect(mockReadFileSync).not.toHaveBeenCalled();
    expect(mkdirSync).toHaveBeenCalled();
  });
});
