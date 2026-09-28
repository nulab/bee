# Contributing to bee

Thank you for your interest in contributing to bee! This guide covers environment setup, development workflow, and release process. For coding conventions, architecture, and command patterns, see [AGENTS.md](AGENTS.md).

## Questions and Bug Reports

Bug reports, feature requests, and questions are handled via [GitHub Issues](https://github.com/nulab/bee/issues/new/choose) — you can write in English or Japanese.

Issues are public. Before you post, remove any credentials, personal information, or confidential data — API keys, OAuth tokens, space URLs, issue keys, user names, and anything else you would not publish. Replace them with placeholders in commands, logs, and screenshots.

## Prerequisites

- [Vite+](https://viteplus.dev/guide/) (`vp`) — manages the Node.js version (from `.node-version`) and pnpm (from `packageManager`), and runs every build, test, lint, and format task

## Getting Started

```sh
# Clone the repository
git clone https://github.com/nulab/bee.git
cd bee

# Install vp (once per machine)
curl -fsSL https://vite.plus | bash

# Install dependencies (also installs the pre-commit hook)
vp install
```

`vp` delegates to the `vite-plus` version pinned in this repository, so the global install only needs to exist. If you already manage Node.js 24 and pnpm yourself, `pnpm install` works too; run the commands below as `pnpm exec vp ...`.

## Development Workflow

### Running the CLI locally

```sh
vp run --filter @nulab/bee dev
```

### Verifying changes

```sh
vp check   # Format, lint, and type check
vp test    # Run all tests
```

You do **not** need to fix formatting or lint issues by hand — the pre-commit hook runs `vp check --fix` on staged files at commit time.

### Running a single test file

```sh
vp test packages/backlog-utils/src/client.test.ts
```

### Building

```sh
vp run --filter @nulab/bee build
```

## Pull Requests

- Create a feature branch from `main`.
- Keep commits in English, following [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, etc.).
- PR titles and descriptions should be in English.
- CI runs tests on Node.js 22 and 24, type checking, linting, and format checking, and installs the packed CLI on Node.js 20, 22, and 24 to smoke test it.

## Release Process

Releases are triggered manually via the [Release workflow](https://github.com/nulab/bee/actions/workflows/release.yml) (`workflow_dispatch`).

1. Go to **Actions > Release > Run workflow**.
2. Select the inputs:
   - **environment** — `dry-run` (default) or `production`
   - **newversion** — `patch`, `minor`, or `major`
   - **prerelease** — check to release as rc (prerelease)
3. The workflow will:
   - Determine the new version from the latest git tag (not from `package.json`)
   - Build the CLI
   - Publish to npm with provenance
   - Create a git tag and push it (no version commit is pushed to the branch)
   - Create a GitHub release with auto-generated notes

Dry-run mode publishes with `--dry-run` and skips git tag/push, so it's safe to test.

### Input combinations

| newversion | prerelease | Example result                                            | npm tag  |
| ---------- | ---------- | --------------------------------------------------------- | -------- |
| `minor`    | unchecked  | `1.0.0` → `1.1.0`                                         | `latest` |
| `major`    | unchecked  | `1.0.0` → `2.0.0`                                         | `latest` |
| `patch`    | unchecked  | `1.0.1` → `1.0.2`                                         | `latest` |
| `minor`    | checked    | `1.0.0` → `1.1.0-rc.0`                                    | `rc`     |
| `major`    | checked    | `1.0.0` → `2.0.0-rc.0`                                    | `rc`     |
| `minor`    | checked    | `1.1.0-rc.0` → `1.1.0-rc.1` (already rc: bumps rc number) | `rc`     |
| `minor`    | unchecked  | `1.1.0-rc.1` → `1.1.0` (promote to stable)                | `latest` |

## Documentation Site

The documentation site (`apps/docs`) uses Astro Starlight. Command reference pages are auto-generated from CLI source code — do not create markdown files under `apps/docs/src/content/docs/commands/`. See [CLAUDE.md](CLAUDE.md#documentation-site-appsdocs) for details.

```sh
vp run --filter @repo/docs dev    # Local dev server
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
