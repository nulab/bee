# @repo/config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the `@repo/config` package for Backlog CLI configuration management with XDG Base Directory support.

**Architecture:** A standalone workspace package (`packages/config`) providing typed config I/O via rc9 and Valibot validation. Supports multiple Backlog spaces with API Key or OAuth auth, space resolution by priority (explicit > env > default), and shorthand host matching.

**Tech Stack:** Valibot (validation), rc9 (RC file I/O), consola (logging), vitest (testing), unbuild (build)

---

### Task 1: Scaffold @repo/config package

**Files:**

- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/config/build.config.ts`
- Create: `packages/config/vitest.config.ts`

**Step 1: Create package.json**

```json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "imports": {
    "#/*": "./src/*"
  },
  "exports": "./src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "consola": "^3.4.2",
    "rc9": "^2.1.2",
    "valibot": "^1.0.0"
  },
  "devDependencies": {
    "@repo/tsconfigs": "workspace:*",
    "vitest": "^3.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@repo/tsconfigs/base.json",
  "include": ["src"]
}
```

**Step 3: Create build.config.ts**

```typescript
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index"],
  rollup: {
    inlineDependencies: true,
  },
});
```

**Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "config",
  },
});
```

**Step 5: Install dependencies**

Run: `cd packages/config && ni`

Expected: Dependencies installed, lock file updated.

**Step 6: Create placeholder index.ts**

Create `packages/config/src/index.ts`:

```typescript
// Public API will be exported here
```

**Step 7: Verify package setup**

Run: `cd packages/config && nlx tsc --noEmit`

Expected: No TypeScript errors.

**Step 8: Commit**

```bash
git add packages/config/package.json packages/config/tsconfig.json packages/config/build.config.ts packages/config/vitest.config.ts packages/config/src/index.ts pnpm-lock.yaml
git commit -m "chore(config): scaffold @repo/config package with valibot and rc9"
```

---

### Task 2: Implement schema with tests (TDD)

**Files:**

- Create: `packages/config/src/schema.test.ts`
- Create: `packages/config/src/schema.ts`

**Step 1: Write failing schema tests**

Create `packages/config/src/schema.test.ts`:

```typescript
import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { RcAuthSchema, RcSchema, RcSpaceSchema } from "#/schema.ts";

describe("RcAuthSchema", () => {
  it("accepts valid api-key auth", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "api-key",
      apiKey: "abc123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({ method: "api-key", apiKey: "abc123" });
    }
  });

  it("accepts valid oauth auth", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual({
        method: "oauth",
        accessToken: "access",
        refreshToken: "refresh",
      });
    }
  });

  it("accepts oauth auth with clientId and clientSecret", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
      clientId: "my-client-id",
      clientSecret: "my-client-secret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.clientId).toBe("my-client-id");
      expect(result.output.clientSecret).toBe("my-client-secret");
    }
  });

  it("accepts oauth auth without clientId and clientSecret (backward compat)", () => {
    const result = v.safeParse(RcAuthSchema, {
      method: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid method", () => {
    const result = v.safeParse(RcAuthSchema, { method: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects api-key auth without apiKey", () => {
    const result = v.safeParse(RcAuthSchema, { method: "api-key" });
    expect(result.success).toBe(false);
  });

  it("rejects oauth auth without tokens", () => {
    const result = v.safeParse(RcAuthSchema, { method: "oauth" });
    expect(result.success).toBe(false);
  });
});

describe("RcSpaceSchema", () => {
  const validAuth = { method: "api-key" as const, apiKey: "key" };

  it("accepts valid backlog.com host", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "example.backlog.com",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid backlog.jp host", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "example.backlog.jp",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
  });

  it("accepts host with hyphens and numbers", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "my-team-01.backlog.com",
      auth: validAuth,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid host domain", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "example.invalid.com",
      auth: validAuth,
    });
    expect(result.success).toBe(false);
  });

  it("rejects host with uppercase letters", () => {
    const result = v.safeParse(RcSpaceSchema, {
      host: "Example.backlog.com",
      auth: validAuth,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty host", () => {
    const result = v.safeParse(RcSpaceSchema, { host: "", auth: validAuth });
    expect(result.success).toBe(false);
  });
});

describe("RcSchema", () => {
  it("accepts empty config with defaults", () => {
    const result = v.safeParse(RcSchema, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.spaces).toEqual([]);
      expect(result.output.aliases).toEqual({});
      expect(result.output.defaultSpace).toBeUndefined();
    }
  });

  it("accepts config with defaultSpace", () => {
    const result = v.safeParse(RcSchema, {
      defaultSpace: "example.backlog.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.defaultSpace).toBe("example.backlog.com");
    }
  });

  it("accepts config with spaces", () => {
    const result = v.safeParse(RcSchema, {
      spaces: [
        {
          host: "example.backlog.com",
          auth: { method: "api-key", apiKey: "key" },
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.spaces).toHaveLength(1);
    }
  });

  it("rejects invalid space in spaces array", () => {
    const result = v.safeParse(RcSchema, {
      spaces: [{ host: "invalid", auth: { method: "api-key", apiKey: "key" } }],
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/config && nlx vitest run`

Expected: FAIL — cannot resolve `#/schema.ts` (module does not exist yet).

**Step 3: Implement schema**

Create `packages/config/src/schema.ts`:

```typescript
import * as v from "valibot";

const ApiKeyAuthSchema = v.object({
  method: v.literal("api-key"),
  apiKey: v.string(),
});

const OAuthAuthSchema = v.object({
  method: v.literal("oauth"),
  accessToken: v.string(),
  refreshToken: v.string(),
  clientId: v.optional(v.string()),
  clientSecret: v.optional(v.string()),
});

export const RcAuthSchema = v.variant("method", [ApiKeyAuthSchema, OAuthAuthSchema]);

export const RcSpaceSchema = v.object({
  host: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.backlog\.(com|jp)$/)),
  auth: RcAuthSchema,
});

export const RcSchema = v.object({
  defaultSpace: v.optional(v.string()),
  spaces: v.optional(v.array(RcSpaceSchema), []),
  aliases: v.optional(v.record(v.string(), v.string()), {}),
});

export type RcAuth = v.InferOutput<typeof RcAuthSchema>;

export type RcSpace = v.InferOutput<typeof RcSpaceSchema>;

export type Rc = v.InferOutput<typeof RcSchema>;
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/config && nlx vitest run`

Expected: All schema tests PASS.

**Step 5: Commit**

```bash
git add packages/config/src/schema.ts packages/config/src/schema.test.ts
git commit -m "feat(config): add Valibot schemas for RcAuth, RcSpace, and Rc"
```

---

### Task 3: Implement config I/O with tests (TDD)

**Files:**

- Create: `packages/config/src/config.test.ts`
- Create: `packages/config/src/config.ts`

**Step 1: Write failing config tests**

Create `packages/config/src/config.test.ts`:

```typescript
import { read, write } from "rc9";
import { describe, expect, it, vi } from "vitest";

vi.mock("rc9", () => ({
  read: vi.fn(),
  write: vi.fn(),
}));

// Must import after mock setup
const { loadConfig, writeConfig } = await import("#/config.ts");

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
  it("writes config to rc file", () => {
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

    expect(mockWrite).toHaveBeenCalledWith(config, expect.objectContaining({ name: ".backlogrc" }));
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/config && nlx vitest run src/config.test.ts`

Expected: FAIL — cannot resolve `#/config.ts`.

**Step 3: Implement config.ts**

Create `packages/config/src/config.ts`:

```typescript
import { homedir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import consola from "consola";
import { read, write } from "rc9";
import { type Rc, RcSchema } from "#/schema.ts";

const CONFIG_DIR_NAME = "backlog";
const CONFIG_FILE_NAME = ".backlogrc";

const resolveConfigDir = (): string => {
  const xdgConfigHome = process.env["XDG_CONFIG_HOME"];
  const base = xdgConfigHome ?? join(homedir(), ".config");
  return join(base, CONFIG_DIR_NAME);
};

export const loadConfig = (): Rc => {
  const dir = resolveConfigDir();
  const raw = read({ name: CONFIG_FILE_NAME, dir });
  const result = v.safeParse(RcSchema, raw);

  if (!result.success) {
    consola.error("Configuration Error:");
    for (const issue of result.issues) {
      consola.error(issue.message);
    }
    process.exit(1);
  }

  return result.output;
};

export const writeConfig = (config: Rc): void => {
  const dir = resolveConfigDir();
  write(config, { name: CONFIG_FILE_NAME, dir });
};
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/config && nlx vitest run src/config.test.ts`

Expected: All config tests PASS.

**Step 5: Commit**

```bash
git add packages/config/src/config.ts packages/config/src/config.test.ts
git commit -m "feat(config): add loadConfig/writeConfig with XDG Base Directory support"
```

---

### Task 4: Implement space management with tests (TDD)

**Files:**

- Create: `packages/config/src/space.test.ts`
- Create: `packages/config/src/space.ts`

**Step 1: Write failing space tests**

Create `packages/config/src/space.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/config.ts", () => ({
  loadConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

const { loadConfig, writeConfig } = await import("#/config.ts");
const { addSpace, findSpace, removeSpace, resolveSpace, updateSpaceAuth } =
  await import("#/space.ts");

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
    delete process.env["BACKLOG_SPACE"];
  });

  it("returns space matching explicit host", () => {
    const space = makeSpace("explicit.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space]));

    const result = resolveSpace("explicit.backlog.com");

    expect(result).toEqual(space);
  });

  it("returns space matching BACKLOG_SPACE env var", () => {
    const space = makeSpace("env.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space]));
    process.env["BACKLOG_SPACE"] = "env.backlog.com";

    const result = resolveSpace();

    expect(result).toEqual(space);
  });

  it("returns space matching defaultSpace config", () => {
    const space = makeSpace("default.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space], "default.backlog.com"));

    const result = resolveSpace();

    expect(result).toEqual(space);
  });

  it("prioritizes explicit host over env and default", () => {
    const explicit = makeSpace("explicit.backlog.com");
    const env = makeSpace("env.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([explicit, env], "env.backlog.com"));
    process.env["BACKLOG_SPACE"] = "env.backlog.com";

    const result = resolveSpace("explicit.backlog.com");

    expect(result).toEqual(explicit);
  });

  it("returns null when no host is resolvable", () => {
    mockLoadConfig.mockReturnValue(makeConfig([]));

    const result = resolveSpace();

    expect(result).toBeNull();
  });

  it("returns null when host is specified but not found", () => {
    mockLoadConfig.mockReturnValue(makeConfig([]));

    const result = resolveSpace("missing.backlog.com");

    expect(result).toBeNull();
  });

  it("resolves space with shorthand name", () => {
    const space = makeSpace("myspace.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space]));

    const result = resolveSpace("myspace");

    expect(result).toEqual(space);
  });

  it("throws when shorthand matches multiple spaces", () => {
    const spaceCom = makeSpace("myspace.backlog.com");
    const spaceJp = makeSpace("myspace.backlog.jp");
    mockLoadConfig.mockReturnValue(makeConfig([spaceCom, spaceJp]));

    expect(() => resolveSpace("myspace")).toThrow('Ambiguous space name "myspace"');
  });

  it("resolves shorthand from BACKLOG_SPACE env var", () => {
    const space = makeSpace("envspace.backlog.com");
    mockLoadConfig.mockReturnValue(makeConfig([space]));
    process.env["BACKLOG_SPACE"] = "envspace";

    const result = resolveSpace();

    expect(result).toEqual(space);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/config && nlx vitest run src/space.test.ts`

Expected: FAIL — cannot resolve `#/space.ts`.

**Step 3: Implement space.ts**

Create `packages/config/src/space.ts`:

```typescript
import type { RcAuth, RcSpace } from "#/schema.ts";

import { loadConfig, writeConfig } from "#/config.ts";

export const addSpace = (space: RcSpace): void => {
  const config = loadConfig();
  const exists = config.spaces.some((s) => s.host === space.host);

  if (exists) {
    throw new Error(`Space with host "${space.host}" already exists in configuration.`);
  }

  writeConfig({
    ...config,
    spaces: [...config.spaces, space],
  });
};

export const removeSpace = (host: string): void => {
  const config = loadConfig();
  const index = config.spaces.findIndex((space) => space.host === host);

  if (index === -1) {
    throw new Error(`Space with host "${host}" not found in configuration.`);
  }

  const spaces = config.spaces.filter((space) => space.host !== host);
  const defaultSpace = config.defaultSpace === host ? undefined : config.defaultSpace;

  writeConfig({ ...config, spaces, defaultSpace });
};

export const updateSpaceAuth = (host: string, auth: RcAuth): void => {
  const config = loadConfig();
  const index = config.spaces.findIndex((space) => space.host === host);
  const space = config.spaces[index];

  if (index === -1 || space == null) {
    throw new Error(`Space with host "${host}" not found in configuration.`);
  }

  writeConfig({
    ...config,
    spaces: config.spaces.with(index, { ...space, auth }),
  });
};

export const findSpace = (spaces: readonly RcSpace[], host: string): RcSpace | null => {
  const exactMatch = spaces.find((s) => s.host === host);
  if (exactMatch) {
    return exactMatch;
  }

  const prefixMatches = spaces.filter((s) => s.host.startsWith(`${host}.`));

  const [singleMatch] = prefixMatches;
  if (singleMatch && prefixMatches.length === 1) {
    return singleMatch;
  }

  if (prefixMatches.length > 1) {
    const candidates = prefixMatches.map((s) => s.host).join(", ");
    throw new Error(`Ambiguous space name "${host}". Matching spaces: ${candidates}`);
  }

  return null;
};

export const resolveSpace = (explicitHost?: string): RcSpace | null => {
  const config = loadConfig();
  const host = explicitHost ?? process.env["BACKLOG_SPACE"] ?? config.defaultSpace;

  if (!host) {
    return null;
  }

  return findSpace(config.spaces, host);
};
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/config && nlx vitest run src/space.test.ts`

Expected: All space tests PASS.

**Step 5: Commit**

```bash
git add packages/config/src/space.ts packages/config/src/space.test.ts
git commit -m "feat(config): add space management with findSpace, resolveSpace, and CRUD ops"
```

---

### Task 5: Index exports and final verification

**Files:**

- Modify: `packages/config/src/index.ts`

**Step 1: Update index.ts with public API exports**

```typescript
export { loadConfig, writeConfig } from "#/config.ts";
export { addSpace, findSpace, removeSpace, resolveSpace, updateSpaceAuth } from "#/space.ts";
export type { Rc, RcAuth, RcSpace } from "#/schema.ts";
```

**Step 2: Run all tests**

Run: `cd packages/config && nlx vitest run`

Expected: All tests PASS (schema + config + space).

**Step 3: Run lint**

Run: `pnpm run lint`

Expected: No errors. Fix any warnings if needed.

**Step 4: Run type check**

Run: `cd packages/config && nlx tsc --noEmit`

Expected: No TypeScript errors.

**Step 5: Commit**

```bash
git add packages/config/src/index.ts
git commit -m "feat(config): export public API from @repo/config"
```
