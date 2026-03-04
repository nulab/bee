import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./config", () => ({
  loadConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

const { loadConfig, writeConfig } = await import("./config");
const { addSpace, findSpace, removeSpace, resolveSpace, updateSpaceAuth } = await import("./space");

const mockLoadConfig = vi.mocked(loadConfig);
const mockWriteConfig = vi.mocked(writeConfig);

const makeSpace = (host: string) => ({
  host,
  auth: { method: "api-key" as const, apiKey: "key123" },
});

const makeConfig = (spaces: ReturnType<typeof makeSpace>[], defaultSpace?: string) => ({
  spaces,
  defaultSpace,
  aliases: {} as Record<string, string>,
});

describe("addSpace", () => {
  it("adds a new space to config", () => {
    mockLoadConfig.mockReturnValue(makeConfig([]));

    const newSpace = makeSpace("new.backlog.com");
    addSpace(newSpace);

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        spaces: [newSpace],
      }),
    );
  });

  it("throws if space with same host already exists", () => {
    const existing = makeSpace("existing.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([existing]));

    expect(() => addSpace(makeSpace("existing.backlog.com"))).toThrow(
      'Space with host "existing.backlog.com" already exists',
    );
  });
});

describe("removeSpace", () => {
  it("removes an existing space", () => {
    const space1 = makeSpace("one.backlog.com");
    const space2 = makeSpace("two.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space1, space2]));

    removeSpace("one.backlog.com");

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        spaces: [space2],
      }),
    );
  });

  it("clears defaultSpace when removing the default space", () => {
    const space = makeSpace("default.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space], "default.backlog.com"));

    removeSpace("default.backlog.com");

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSpace: undefined,
      }),
    );
  });

  it("keeps defaultSpace when removing a non-default space", () => {
    const space1 = makeSpace("one.backlog.com");
    const space2 = makeSpace("two.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space1, space2], "one.backlog.com"));

    removeSpace("two.backlog.com");

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSpace: "one.backlog.com",
      }),
    );
  });

  it("throws if space not found", () => {
    mockLoadConfig.mockReturnValue(makeConfig([]));

    expect(() => removeSpace("missing.backlog.com")).toThrow(
      'Space with host "missing.backlog.com" not found',
    );
  });
});

describe("updateSpaceAuth", () => {
  it("updates auth for an existing space", () => {
    const space = makeSpace("target.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space]));

    const newAuth = {
      method: "oauth" as const,
      accessToken: "new-access",
      refreshToken: "new-refresh",
    };

    updateSpaceAuth("target.backlog.com", newAuth);

    expect(mockWriteConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        spaces: [{ host: "target.backlog.com", auth: newAuth }],
      }),
    );
  });

  it("throws if space not found", () => {
    mockLoadConfig.mockReturnValue(makeConfig([]));

    expect(() =>
      updateSpaceAuth("missing.backlog.com", {
        method: "api-key",
        apiKey: "key",
      }),
    ).toThrow('Space with host "missing.backlog.com" not found');
  });
});

describe("findSpace", () => {
  it("returns space with exactly matching host", () => {
    const space = makeSpace("myspace.backlog.com");
    const result = findSpace([space], "myspace.backlog.com");

    expect(result).toEqual(space);
  });

  it("returns space with prefix match (shorthand)", () => {
    const space = makeSpace("myspace.backlog.com");
    const result = findSpace([space], "myspace");

    expect(result).toEqual(space);
  });

  it("throws when shorthand matches multiple spaces", () => {
    const spaceCom = makeSpace("myspace.backlog.com");
    const spaceJp = makeSpace("myspace.backlog.jp");

    expect(() => findSpace([spaceCom, spaceJp], "myspace")).toThrow(
      'Ambiguous space name "myspace". Matching spaces: myspace.backlog.com, myspace.backlog.jp',
    );
  });

  it("prioritizes exact match over prefix match", () => {
    const exactSpace = makeSpace("myspace.backlog.com");
    const otherSpace = makeSpace("myspace.backlog.com.extra.backlog.com");
    const result = findSpace([exactSpace, otherSpace], "myspace.backlog.com");

    expect(result).toEqual(exactSpace);
  });

  it("returns null when no match found", () => {
    const space = makeSpace("other.backlog.com");
    const result = findSpace([space], "unknown");

    expect(result).toBeNull();
  });

  it("returns null for empty spaces array", () => {
    const result = findSpace([], "myspace");

    expect(result).toBeNull();
  });
});

describe("resolveSpace", () => {
  beforeEach(() => {
    delete process.env.BACKLOG_SPACE;
  });

  it("returns space matching BACKLOG_SPACE env var", () => {
    const space = makeSpace("env.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space]));
    process.env.BACKLOG_SPACE = "env.backlog.com";

    const result = resolveSpace();

    expect(result).toEqual(space);
  });

  it("returns space matching defaultSpace config", () => {
    const space = makeSpace("default.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space], "default.backlog.com"));

    const result = resolveSpace();

    expect(result).toEqual(space);
  });

  it("returns null when no host is resolvable", () => {
    mockLoadConfig.mockReturnValue(makeConfig([]));

    const result = resolveSpace();

    expect(result).toBeNull();
  });

  it("resolves shorthand from BACKLOG_SPACE env var", () => {
    const space = makeSpace("envspace.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space]));
    process.env.BACKLOG_SPACE = "envspace";

    const result = resolveSpace();

    expect(result).toEqual(space);
  });
});
