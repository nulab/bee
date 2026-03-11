import { describe, expect, it, vi } from "vitest";

vi.mock("./config", () => ({
  updateConfig: vi.fn(),
}));

const { updateConfig } = await import("./config");
const { addSpace, findSpace, removeAllSpaces, removeSpace, updateSpaceAuth } =
  await import("./space");

const mockUpdateConfig = vi.mocked(updateConfig);

const makeSpace = (host: string) => ({
  host,
  auth: { method: "api-key" as const, apiKey: "key123" },
});

const makeConfig = (spaces: ReturnType<typeof makeSpace>[], defaultSpace?: string) => ({
  spaces,
  defaultSpace,
  aliases: {} as Record<string, string>,
});

/**
 * Sets up mockUpdateConfig to call the updater with the given config
 * and returns the result for assertion.
 */
const setupUpdateConfig = (config: ReturnType<typeof makeConfig>) => {
  mockUpdateConfig.mockImplementation((updater) => updater(config));
};

describe("addSpace", () => {
  it("adds a new space to config", () => {
    setupUpdateConfig(makeConfig([]));

    const newSpace = makeSpace("new.backlog.com");
    addSpace(newSpace);

    expect(mockUpdateConfig).toHaveBeenCalled();
    const result = mockUpdateConfig.mock.results[0]?.value;
    expect(result.spaces).toEqual([newSpace]);
  });

  it("throws if space with same host already exists", () => {
    const existing = makeSpace("existing.backlog.com");
    setupUpdateConfig(makeConfig([existing]));

    expect(() => addSpace(makeSpace("existing.backlog.com"))).toThrow(
      'Space with host "existing.backlog.com" already exists',
    );
  });
});

describe("removeSpace", () => {
  it("removes an existing space", () => {
    const space1 = makeSpace("one.backlog.com");
    const space2 = makeSpace("two.backlog.com");
    setupUpdateConfig(makeConfig([space1, space2]));

    removeSpace("one.backlog.com");

    const result = mockUpdateConfig.mock.results[0]?.value;
    expect(result.spaces).toEqual([space2]);
  });

  it("clears defaultSpace when removing the default space", () => {
    const space = makeSpace("default.backlog.com");
    setupUpdateConfig(makeConfig([space], "default.backlog.com"));

    removeSpace("default.backlog.com");

    const result = mockUpdateConfig.mock.results[0]?.value;
    expect(result.defaultSpace).toBeUndefined();
  });

  it("keeps defaultSpace when removing a non-default space", () => {
    const space1 = makeSpace("one.backlog.com");
    const space2 = makeSpace("two.backlog.com");
    setupUpdateConfig(makeConfig([space1, space2], "one.backlog.com"));

    removeSpace("two.backlog.com");

    const result = mockUpdateConfig.mock.results[0]?.value;
    expect(result.defaultSpace).toBe("one.backlog.com");
  });

  it("throws if space not found", () => {
    setupUpdateConfig(makeConfig([]));

    expect(() => removeSpace("missing.backlog.com")).toThrow(
      'Space with host "missing.backlog.com" not found',
    );
  });
});

describe("removeAllSpaces", () => {
  it("removes all spaces and clears defaultSpace", () => {
    const space1 = makeSpace("one.backlog.com");
    const space2 = makeSpace("two.backlog.com");
    setupUpdateConfig(makeConfig([space1, space2], "one.backlog.com"));

    removeAllSpaces();

    const result = mockUpdateConfig.mock.results[0]?.value;
    expect(result.spaces).toEqual([]);
    expect(result.defaultSpace).toBeUndefined();
  });

  it("works when no spaces exist", () => {
    setupUpdateConfig(makeConfig([]));

    removeAllSpaces();

    const result = mockUpdateConfig.mock.results[0]?.value;
    expect(result.spaces).toEqual([]);
    expect(result.defaultSpace).toBeUndefined();
  });
});

describe("updateSpaceAuth", () => {
  it("updates auth for an existing space", () => {
    const space = makeSpace("target.backlog.com");
    setupUpdateConfig(makeConfig([space]));

    const newAuth = {
      method: "oauth" as const,
      accessToken: "new-access",
      refreshToken: "new-refresh",
    };

    updateSpaceAuth("target.backlog.com", newAuth);

    const result = mockUpdateConfig.mock.results[0]?.value;
    expect(result.spaces).toEqual([{ host: "target.backlog.com", auth: newAuth }]);
  });

  it("throws if space not found", () => {
    setupUpdateConfig(makeConfig([]));

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
