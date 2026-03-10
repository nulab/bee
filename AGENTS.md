# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

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
apps/cli             — CLI entry point (citty framework, consola logging)
apps/docs            — Astro Starlight documentation site
packages/backlog-utils — Backlog API client wrapper (backlog-js, OAuth auto-refresh, rate-limit handling)
packages/cli-utils   — Shared CLI utilities (output formatting, table, splitArg, prompts)
packages/config      — CLI configuration management (~/.config/bee RC file, space/auth resolution)
packages/test-utils  — Shared test helpers (mock client, mock consola, process.exit spy, vi.clearAllMocks setup)
packages/tsconfigs   — Shared TypeScript base config
```

### Documentation site (`apps/docs`)

Command reference pages are **auto-generated** from CLI source code — do NOT create `.md` files under `apps/docs/src/content/docs/commands/`. The dynamic route `apps/docs/src/pages/commands/[...slug].astro` uses `loadCommands()` (in `apps/docs/src/lib/commands.ts`) to import each command's `commandUsage` and `defineCommand` metadata at build time and render documentation pages automatically.

**When adding or removing CLI commands**, also update the command table in `skills/using-bee/SKILL.md` to keep the Skill in sync with the CLI.

### Skills (`skills/`)

AI エージェント向けの Skill 定義を格納するディレクトリ。

| Skill | 用途 | 自動トリガー |
|---|---|---|
| `using-bee` | bee CLI の使い方（コマンド、フラグ、パターン） | Yes — Backlog 関連の会話で自動発動 |
| `backlog-notation` | Backlog 記法（Backlog記法）の構文リファレンス | No — AGENTS.md やプロンプトで明示的に有効化 |

`backlog-notation` は Backlog 記法を使うプロジェクト向けの構文リファレンスです。Backlog ではプロジェクトごとに Markdown か Backlog 記法を選択できるため、このスキルは自動トリガーされません。Backlog 記法を使うプロジェクトで作業する場合は、プロジェクトの AGENTS.md やプロンプトで明示的に有効化してください。

#### Definition lists

The docs site supports Markdown definition list syntax via `remark-definition-list`. Use this instead of raw `<dl>`/`<dt>`/`<dd>` HTML:

```mdx
<!-- Correct — Markdown definition list -->

用語
: 説明文

<!-- Wrong — raw HTML -->

<dl>
  <dt>用語</dt>
  <dd>説明文</dd>
</dl>
```

This also works inside JSX components like `<Card>`.

#### Internal link conventions

All internal links in documentation content (`apps/docs/src/content/docs/`) must use **absolute paths with the base prefix `/bee/` and a trailing slash**:

```mdx
<!-- Correct -->

[認証ガイド](/bee/guides/authentication/)

<LinkCard title="CI/CD" href="/bee/integrations/ci-cd/" />

<!-- Wrong — relative paths -->

[認証ガイド](../guides/authentication/)

<LinkCard title="CI/CD" href="../../integrations/ci-cd/" />

<!-- Wrong — missing trailing slash -->

[認証ガイド](/bee/guides/authentication)

<!-- Wrong — missing base prefix -->

[認証ガイド](/guides/authentication/)
```

- Links to file resources (`.md`, `.txt`) do NOT get a trailing slash: `[file](/bee/llms.txt)`
- `starlight-links-validator` runs at build time and fails on broken links
- Command reference pages (`/bee/commands/**`) are dynamically generated and excluded from link validation

**To add docs for a new command group**, only add sidebar entries to `apps/docs/astro.config.mjs`:

```js
{
  label: "issue",
  items: [
    { label: "issue list", link: "/commands/issue/list" },
    // ...
  ],
},
```

`@repo/backlog-utils` exposes `getClient()` which returns a `backlog-js` `Backlog` instance with OAuth 401 auto-refresh (via Proxy) and rate-limit error handling. Commands call `client.getIssues()`, `client.getProjects()`, etc. directly.

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

- **`description` is pure prose** — keep it a short, human-readable explanation. Do not embed format hints, examples, or choice lists in the description.
- **Use `valueHint` for supplementary value information** — choices, formats, examples, and type hints go in the `valueHint` property, not in `description`. `valueHint` is rendered in `--help` (flag column / arguments section), docs, and interactive prompts automatically.
- **Same-meaning arguments share the same description across commands** — if `--space` means the same thing in `auth login` and `auth logout`, use the identical description string. Do not vary wording per command context.
- **Edit/update flags signal intent in the description** — in `edit` / `update` commands, descriptions must make it clear the flag sets a new value:
  - String flags: `"New X of the Y"` (e.g., `"New name of the project"`)
  - Boolean toggles: `"Change whether X"` (e.g., `"Change whether the chart is enabled"`)
  - Enum flags: `"Change X"` with `valueHint: "{a|b}"` (e.g., `description: "Change text formatting rule"`, `valueHint: "{backlog|markdown}"`)

### `valueHint` conventions

`valueHint` provides machine-readable value metadata that is displayed across `--help`, docs, and prompts. Use it for any argument where users need guidance on what values to enter.

| Pattern       | `valueHint`      | Example                                  |
| ------------- | ---------------- | ---------------------------------------- |
| Fixed choices | `"{x\|y\|z}"`    | `"{api-key\|oauth}"`, `"{asc\|desc}"`    |
| Date format   | `"<yyyy-MM-dd>"` | Date fields                              |
| Example value | `"<example>"`    | `"<PROJECT-123>"`, `"<xxx.backlog.com>"` |
| Numeric range | `"<min-max>"`    | `"<1-100>"`                              |
| Type hint     | `"<type>"`       | `"<number>"`                             |

```ts
// Choices
method: {
  type: "string",
  description: "The authentication method to use",
  valueHint: "{api-key|oauth}",
},
// Date format
"start-date": {
  type: "string",
  description: "Start date",
  valueHint: "<yyyy-MM-dd>",
},
// Example value (positional)
issue: {
  type: "positional",
  description: "Issue ID or issue key",
  valueHint: "<PROJECT-123>",
},
```

Where `valueHint` is rendered:

- **`--help` flags**: after the flag name (e.g., `--sort {issueType|category|...}`)
- **`--help` arguments**: after the description text
- **Docs**: as `<code>` next to the description
- **`promptRequired`**: appended to the prompt label (e.g., `Priority {high|normal|low}:`)

### Short flag aliases

Following gh CLI conventions, only assign single-letter aliases (`-n`, `-d`, etc.) to flags that are **high-frequency and cross-cutting** — flags users type routinely across many commands (e.g., `--name`, `--body`, `--title`). Leave all other flags long-form only:

- **Settings / toggles** (`--archived`, `--chart-enabled`) — infrequently changed, long-form is fine.
- **Operation-prefixed flags** (`--add-label`, `--remove-label`) — short aliases would obscure the operation semantics.
- **Safety / confirmation flags** — intentionally verbose to force deliberate typing.

When two flags in the same command would collide on the same letter, one (or both) must stay long-form. Prefer giving the alias to the more frequently used flag.

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

## Command Implementation Patterns

### Subcommand registration

Register subcommands in `index.ts` using lazy imports:

```ts
subCommands: {
  list: () => import("./list").then((m) => m.list),
  view: () => import("./view").then((m) => m.view),
},
```

### Output formatting (`@repo/cli-utils`)

- **`outputArgs` / `outputResult(data, args, formatter)`** — `--json` flag pattern. Spread `...outputArgs` into `args`, then wrap output with `outputResult`. The formatter callback handles human-readable output; JSON mode bypasses it.
- **`printTable(rows)`** — tabular output for list commands.

### Multiple-value flags with `splitArg`

Use `splitArg(input, schema)` from `@repo/cli-utils` to parse comma-separated flag values with valibot validation:

```ts
const statuses = splitArg(args.status, vIssueStatusType);
// --status 1,2,3 → [1, 2, 3] (validated against schema)
```

### `--web` flag

View commands support `--web` to open the resource in a browser. Build the URL (e.g., `issueUrl`) and pass to `openUrl`.

### `@me` replacement

`--assignee @me` resolves the current user's ID via `client.getMyself()`. Apply this pattern wherever user IDs accept `@me`.

### Interactive prompts (`promptRequired` / `confirmOrExit`)

- **`promptRequired(label, existing, options?)`** — if the flag value is provided, returns it; otherwise prompts interactively. Automatically detects non-interactive environments via `process.stdin.isTTY`.
- **`confirmOrExit(message, skipConfirm?)`** — confirmation prompt for destructive actions. `--yes` flag skips via `skipConfirm`. Returns `false` if cancelled.

### Stdin pipe support (`resolveStdinArg`)

Use `resolveStdinArg(value)` for flags that accept piped input (e.g., `--body`). Returns stdin content when the flag is empty and stdin is piped, otherwise returns the original value.

## User-Facing Message Conventions

### consola method usage

- **`consola.success()`** — action completion (create, update, delete, login, etc.)
- **`consola.info()`** — informational (e.g., "No results found.", "Opening ... in browser.")
- **`consola.error()`** — errors and validation failures
- **`consola.start()`** — progress indicator for async operations (e.g., "Access token expired. Refreshing...")
- **`consola.log()`** — raw output (tables, spacing)

### Success message format

CRUD and action messages follow two patterns depending on the resource type:

| Resource type                                                               | Pattern                               | Example                         |
| --------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- |
| ID-based (category, status, milestone, webhook, issue-type, team, document) | `<Verb> <resource> <name> (ID: <id>)` | `Created category Bug (ID: 5)`  |
| Key-based (issue, project, PR, wiki)                                        | `<Verb> <resource> <key>: <name>`     | `Created issue PROJ-1: Fix bug` |

- Use past tense verbs: Created, Updated, Deleted, Added, Removed, Starred, Closed, Reopened, etc.
- Do not quote or backtick resource names/IDs in success messages.

### "No results" messages

All list commands use the pattern: `consola.info("No <plural> found.")` (e.g., `"No issues found."`, `"No statuses found."`).

### Error messages

- Quote invalid user input with double quotes: `` `Invalid field format: "${pair}". Expected key=value.` ``
- Reference CLI commands with backticks: ``Run `bee auth login` to authenticate.``
- Always use `bee` as the CLI command name (never `bl` or other aliases).

### String formatting

- Always use template literals (backticks) for messages containing variables — never string concatenation with `+`.
- Use `consola` methods — never `console.log` / `console.error`.

## Test Conventions

- **Test titles**: Always in English. Use `verb + condition` pattern (e.g., `"shows error when X"`, `"calls Y when Z"`).
- **Mock at package boundaries** — mock entire packages (`@repo/backlog-utils`, `@repo/config`, etc.), not internal functions. Each package is independently tested; CLI command tests trust the package interface.
- **CLI command tests verify side-effect composition** — assert which functions were called, in what order, and with what arguments. Actual network I/O and file I/O belong in package-level or E2E tests.
- **Cover both happy path and error paths** — each command should have tests for success, auth/config failures, and edge cases (e.g., empty state, already-existing resources).
- **Error path tests must exercise actual branching logic** — test explicit `throw`, `consola.error()`, or early `return` branches in the implementation. Do not write tests that only verify default error propagation (e.g., testing that an `await` without `try/catch` propagates a rejection is testing JavaScript, not the command).
- **Extract shared mock setup into helper functions** — when multiple tests in the same `describe` need the same mock state, use a named setup function (e.g., `setupOAuthMocks()`).

### What to test vs. what not to test

Following [CLI Guidelines (clig.dev)](https://clig.dev/), command tests should focus on **CLI user experience** and **application-specific logic**, not on verifying that libraries work correctly.

**DO test (application logic):**

- Custom value resolution (`@me` → user ID, issue key → issue ID, status name → status ID)
- Conditional display logic (`null` → `"Unassigned"`, `archived` → `"Archived"`)
- API payload construction with correct defaults and field composition
- Success/error message content and format (correct verb, resource identifier, URL)
- Output routing (correct `consola` method: `consola.log` for data, `consola.success` for actions, `consola.info` for informational, `consola.error` for errors)
- Confirmation prompts for destructive actions (`confirmOrExit` is called, `--yes` bypasses it)
- Null/undefined resilience in API response display (optional chaining for nullable fields)

**DO NOT test (library/framework responsibility):**

- citty/Commander option parsing (e.g., `--keyword "x"` → `keyword: "x"`)
- `splitArg` / `collect` / `collectNum` array collection behavior
- Boolean flag parsing (`--archived` → `true`)
- Simple option forwarding where the handler passes the parsed value to the API unchanged
- Default error propagation through `await` without `try/catch` (this tests JavaScript, not the command)

**Guiding principle:** If removing the test wouldn't reduce confidence in _your own code_, the test is verifying the library, not the application.

## Type Casting: use valibot instead of `Number()` / `parseInt()`

Bare `Number(value)` silently returns `NaN` for invalid input, which propagates through arithmetic and API calls without error. `parseInt` has similar issues (trailing garbage, radix confusion). **Always use valibot schemas for string-to-number conversion** so that invalid input is caught immediately.

`@repo/cli-utils` exports two reusable schemas:

| Schema          | Validates                | Example output |
| --------------- | ------------------------ | -------------- |
| `vFiniteNumber` | Finite number (no NaN/∞) | `3.14`         |
| `vInteger`      | Integer (no NaN/∞/frac)  | `42`           |

In CLI command handlers, use `parseArg` (which wraps `v.safeParse` and throws
a `UserError` with a friendly message on failure) instead of bare `v.parse`:

```ts
import * as v from "valibot";
import { parseArg, vInteger, vFiniteNumber } from "@repo/cli-utils";

// Required value — label appears in the error message
const id = parseArg(vInteger, opts.id, "--id");

// Optional value (returns undefined when input is undefined)
const count = parseArg(v.optional(vInteger), opts.count, "--count");

// In collectNum-style parsers
const collectNum = (val: string, prev: number[]): number[] => [
  ...prev,
  parseArg(vInteger, val, "value"),
];
```

Use bare `v.parse` / `v.safeParse` only in non-CLI contexts (e.g., API response
validation, internal library code) where a `ValiError` is the appropriate error type.

`String()` for display purposes (e.g., `String(id)` in table rows) is safe because it never produces an unexpected type, so it does not need replacement.

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
