# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Backlog CLI (`backlog` / `bl`) — a command-line interface for the Backlog project management service. pnpm workspace monorepo with ESM-only packages.

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
pnpm --filter @nulab/backlog-cli build

# Dev (CLI)
pnpm --filter @nulab/backlog-cli dev
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
- Use `import type` for type-only imports (enforced by oxlint)

## Subpath Imports

Each package uses Node.js subpath imports (`"imports"` field in package.json) to alias `#src/*` to `./src/*`. Use this instead of relative paths when importing within a package:

```ts
// Preferred (subpath import)
import { createClient } from "#src/client";
// Avoid (deep relative path)
import { createClient } from "../../client";
```

> **Note**: Each package's `tsconfig.json` also has `paths: { "#src/*": ["./src/*"] }` because `moduleResolution: "bundler"` does not resolve `package.json` `imports` wildcards. Both `imports` and `paths` must be kept in sync.

## Architecture

```
apps/cli           — CLI entry point (citty framework, consola logging)
apps/docs          — Astro Starlight documentation site
packages/api-spec  — TypeSpec definitions for Backlog API v2
packages/tsconfigs — Shared TypeScript base config
```

`@nulab/backlog-cli` uses citty's `defineCommand` / `runMain` with subcommand registration.

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
