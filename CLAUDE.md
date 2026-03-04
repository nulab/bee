# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

bee (`bee`) — a CLI for the Backlog project management service. pnpm workspace monorepo with ESM-only packages.

## Commands

```sh
# Install
pnpm install

# Lint (oxlint, NOT ESLint)
pnpm run lint
pnpm run lint:fix

# Type check (tsc --noEmit per package via turbo)
pnpm run typecheck

# Format (oxfmt)
pnpm run format
pnpm run format:check

# Test
pnpm run test                                              # all tests
pnpm --filter @repo/backlog-utils exec vitest run src/client.test.ts # single file

# Build
pnpm --filter @nulab/bee build

# Dev (CLI)
pnpm --filter @nulab/bee dev
```

## Module Resolution: bundler

TypeScript is configured with `module: "preserve"` / `moduleResolution: "bundler"`. This means:

- **Relative imports omit the file extension**:
  ```ts
  // Correct
  import { foo } from "./foo";
  // Wrong
  import { foo } from "./foo.js";
  import { foo } from "./foo.ts";
  ```
- **Inline `type` keyword** — use `import { type Foo, bar }` instead of separate `import type { Foo }` (enforced by oxlint)

## Architecture

```
apps/cli           — CLI entry point (citty framework, consola logging)
apps/docs          — Astro Starlight documentation site
packages/api-spec  — TypeSpec definitions for Backlog API v2
packages/tsconfigs — Shared TypeScript base config
```

`@repo/backlog-utils` exposes `getClient(config)` which returns an ofetch `$Fetch` instance preconfigured with Backlog API v2 base URL, auth, and rate-limit error handling.

`@nulab/bee` uses citty's `defineCommand` / `runMain` with subcommand registration and a custom help system (see below).

## Command Help System

CLI commands use a **single-source help system** inspired by gh CLI. Each command defines a `CommandUsage` object that drives both `--help` output and documentation generation from the same data.

### How it works

1. Each command file exports `commandUsage: CommandUsage` alongside the command definition
2. The command is wrapped with `withUsage(defineCommand({ ... }), commandUsage)` to attach the usage data
3. `runMain` receives `showCommandUsage` as a custom `showUsage` handler, which renders gh-cli style help for commands with attached usage and falls back to citty's default for others

### Adding help to a command

```ts
import { defineCommand } from "citty";
import { type CommandUsage, withUsage } from "./lib/command-usage";

export const commandUsage: CommandUsage = {
  long: "Detailed multi-line description of the command.",
  examples: [{ description: "Do something", command: "bee foo bar" }],
  annotations: {
    environment: [["ENV_VAR_NAME", "Description of what it does"]],
  },
};

export const myCommand = withUsage(
  defineCommand({
    meta: { name: "bar", description: "Short one-liner" },
    args: {
      /* ... */
    },
    async run({ args }) {
      /* ... */
    },
  }),
  commandUsage,
);
```

### Writing help content

- **Every new command must have `commandUsage`** — all commands export `commandUsage: CommandUsage` and wrap with `withUsage`.
- **Reference `gh <command> --help`** for tone and structure — run the corresponding gh CLI help (e.g., `gh auth login --help`) and adapt the content to Backlog's context.
- **`long`**: Multi-paragraph description. First line is a standalone summary. Subsequent paragraphs explain behavior, caveats, and related commands.
- **`examples`**: 2–4 practical examples covering common use cases (interactive, flags, piping).
- **`annotations.environment`**: `[string, string][]` — list relevant environment variables as `[key, description]` pairs. Columns are auto-aligned.

### Writing argument descriptions

Follow gh CLI conventions for `args` description strings:

- **Choices use `{x|y}` notation** — write `{api-key|oauth}`, not `api-key or oauth`.
- **`e.g.,` flows naturally in the sentence** — write `The hostname of the Backlog space. e.g., xxx.backlog.com`, not `Space hostname (e.g., xxx.backlog.com)`.
- **Same-meaning arguments share the same description across commands** — if `--space` means the same thing in `auth login` and `auth logout`, use the identical description string. Do not vary wording per command context.

### Environment variable defaults for arguments

When a command argument can be provided via an environment variable (e.g., `BACKLOG_PROJECT`), use citty's `default` property instead of runtime fallback logic:

```ts
project: {
  type: "positional",
  description: "Project ID or project key",
  required: true,
  default: process.env.BACKLOG_PROJECT,
},
```

citty skips the `required` check when `default` is not `undefined`, so this naturally makes the argument optional when the env var is set and required when it is not. No runtime fallback code (`||` / `??`) is needed.

Also add the env var to `commandUsage.annotations.environment` so it appears in `--help` output.

### Key files

- `apps/cli/src/lib/command-usage.ts` — `CommandUsage` type, `withUsage`, `renderCommandUsage`, `showCommandUsage`
- `apps/cli/src/index.ts` — wires `showCommandUsage` into `runMain`

## Test Conventions

- **Test titles**: Always in English. Use `verb + condition` pattern (e.g., `"shows error when X"`, `"calls Y when Z"`).
- **Mock at package boundaries** — mock entire packages (`@repo/backlog-utils`, `@repo/config`, etc.), not internal functions. Each package is independently tested; CLI command tests trust the package interface.
- **CLI command tests verify side-effect composition** — assert which functions were called, in what order, and with what arguments. Actual network I/O and file I/O belong in package-level or E2E tests.
- **Cover both happy path and error paths** — each command should have tests for success, auth/config failures, and edge cases (e.g., empty state, already-existing resources).
- **Extract shared mock setup into helper functions** — when multiple tests in the same `describe` need the same mock state, use a named setup function (e.g., `setupOAuthMocks()`).

## Code Conventions (enforced by oxlint)

- **Named exports only** — no default exports (`import/no-default-export`)
- **`type` keyword** — use `type` instead of `interface` for type definitions
- **`T[]` syntax** — use `T[]` instead of `Array<T>`
- **`Record<K, V>`** — use `Record` instead of `{ [key: K]: V }`
- **ESM only** — no `require()` or `module.exports`
- **`node:` protocol** — use `node:fs` not `fs` for Node.js built-in modules
- **Strict equality** — always `===` / `!==`
- **Curly braces required** — for all control flow statements
- **No floating Promises** — all Promises must be awaited or explicitly voided
- **Catch variable**: name it `error`

## Tooling

- **Runtime**: Node.js 24 (managed by mise)
- **Package manager**: pnpm (corepack-enabled)
- **Linter**: oxlint (with plugins: import, typescript, unicorn)
- **Formatter**: oxfmt
- **Type checker**: `tsc --noEmit` per package (via Turborepo)
- **Test runner**: Vitest
- **Build**: unbuild
- **Git hooks**: lefthook (pre-commit: oxlint --fix + oxfmt)

## Workflow

Do NOT manually run lint or format during development. The pre-commit hook (lefthook) automatically runs `oxlint --fix` and `oxfmt` on staged files at commit time. Only `typecheck` and `test` need to be run manually when verifying changes.

**`lint` vs `typecheck`**: `lint` uses oxlint for fast static analysis. `typecheck` runs `tsc --noEmit` in each package via Turborepo for full TypeScript type checking. They are independent — run both when verifying changes. `lint` exists for the fast pre-commit hook.

Plan files (implementation plans, design docs, etc.) go in `.claude/plans/`.

## Commit & PR Conventions

- **Commits**: Always in English, following [Conventional Commits](https://www.conventionalcommits.org/). Use `feat` / `fix` only when it genuinely affects semantic versioning — prefer `chore`, `refactor`, `docs`, `test`, `ci`, `build` for non-semver changes.
- **PR / Issue titles**: Always in English.
- **PR / Issue body**: English by default unless otherwise specified.
- **PR assignee**: Always use `--assignee @me` to assign the PR to the current user.
