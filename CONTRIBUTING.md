# Contributing to bee

Thank you for your interest in contributing to bee! This guide covers environment setup, development workflow, and release process. For coding conventions, architecture, and command patterns, see [AGENTS.md](AGENTS.md).

## Prerequisites

- [mise](https://mise.jdx.dev/) (manages Node.js version)
- [pnpm](https://pnpm.io/) (enabled via Corepack)

## Getting Started

```sh
# Clone the repository
git clone https://github.com/nulab/bee.git
cd bee

# Install the correct Node.js version and enable corepack
mise install

# Install dependencies
pnpm install
```

`mise install` will set up Node.js 24 and enable Corepack (which provides pnpm). If you don't use mise, ensure you have Node.js 24+ installed and run `corepack enable` manually.

## Development Workflow

### Running the CLI locally

```sh
pnpm --filter @nulab/bee dev
```

### Verifying changes

```sh
pnpm run typecheck   # Type check all packages (tsc via turbo)
pnpm run test        # Run all tests (vitest)
```

You do **not** need to run lint or format manually — [lefthook](https://github.com/evilmartians/lefthook) runs `oxlint --fix` and `oxfmt` automatically on staged files at commit time.

### Running a single test file

```sh
pnpm --filter @repo/backlog-utils exec vitest run src/client.test.ts
```

### Building

```sh
pnpm --filter @nulab/bee build
```

## Pull Requests

- Create a feature branch from `main`.
- Keep commits in English, following [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, etc.).
- PR titles and descriptions should be in English.
- CI runs tests on Node.js 20, 22, and 24, plus type checking, linting, and format checking.

## Release Process

Releases are triggered manually via the [Release workflow](https://github.com/nulab/bee/actions/workflows/release.yml) (`workflow_dispatch`).

1. Go to **Actions > Release > Run workflow**.
2. Select the **environment** (`dry-run` or production).
3. Select the **version bump** (`patch`, `minor`, or `major`).
4. The workflow will:
   - Bump the version in `apps/cli/package.json`
   - Build the CLI
   - Publish to npm with provenance
   - Create a git tag and GitHub release with auto-generated notes

Dry-run mode publishes with `--dry-run` and skips git tag/push, so it's safe to test.

## Documentation Site

The documentation site (`apps/docs`) uses Astro Starlight. Command reference pages are auto-generated from CLI source code — do not create markdown files under `apps/docs/src/content/docs/commands/`. See [CLAUDE.md](CLAUDE.md#documentation-site-appsdocs) for details.

```sh
pnpm --filter @repo/docs dev    # Local dev server
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
