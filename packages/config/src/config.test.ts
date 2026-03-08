import { readUser, writeUser } from "rc9";
import { describe, expect, it, vi } from "vitest";

vi.mock("rc9", () => ({
  readUser: vi.fn(),
  writeUser: vi.fn(),
}));

// Must import after mock setup
const { loadConfig, updateConfig, writeConfig } = await import("./config");

const mockReadUser = vi.mocked(readUser);
const mockWriteUser = vi.mocked(writeUser);

describe("loadConfig", () => {
  it("returns validated config when rc file is valid", () => {
    mockReadUser.mockReturnValue({
      defaultSpace: "example.backlog.com",
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key", apiKey: "abc123" },
        },
      ],
    });

    const config = loadConfig();

    expect(mockReadUser).toHaveBeenCalledWith(".backlogrc");
    expect(config.defaultSpace).toBe("example.backlog.com");
    expect(config.spaces).toHaveLength(1);
    expect(config.spaces[0]?.host).toBe("example.backlog.com");
  });

  it("returns empty spaces array when rc file is empty", () => {
    mockReadUser.mockReturnValue({});

    const config = loadConfig();

    expect(config.spaces).toEqual([]);
    expect(config.defaultSpace).toBeUndefined();
  });

  it("throws error when config validation fails", () => {
    mockReadUser.mockReturnValue({
      spaces: [{ host: "invalid", auth: { method: "bad" } }],
    });

    expect(() => loadConfig()).toThrow("Configuration Error:");
  });
});

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
  it("writes config via rc9 writeUser", () => {
    writeConfig(sampleConfig);

    expect(mockWriteUser).toHaveBeenCalledWith(sampleConfig, ".backlogrc");
  });
});

describe("updateConfig", () => {
  it("loads config, applies updater, and writes result", () => {
    mockReadUser.mockReturnValue({
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key", apiKey: "abc123" },
        },
      ],
    });

    const result = updateConfig((config) => ({
      ...config,
      defaultSpace: "example.backlog.com",
    }));

    expect(result.defaultSpace).toBe("example.backlog.com");
    expect(mockWriteUser).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSpace: "example.backlog.com" }),
      ".backlogrc",
    );
  });
});
