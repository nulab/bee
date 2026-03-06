# Backlog CLI

Command-line tool to view and manage [Backlog](https://backlog.com/), inspired by GitHub CLI.

> [!NOTE]
> This is not an officially supported Nulab product. It is maintained by volunteers.

**Looking to install and use bee?** See the [CLI package README](apps/cli/README.md) or the [documentation site](https://nulab.github.io).

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) (enabled via Corepack)

### Setup

```sh
corepack enable
pnpm install
```

### Monorepo Structure

This is a pnpm workspace monorepo managed with [Turborepo](https://turbo.build/).

| Package               | Path                     | Description                                       |
| --------------------- | ------------------------ | ------------------------------------------------- |
| `@nulab/bee`          | `apps/cli`               | CLI entry point (citty + consola)                 |
| `@repo/docs`          | `apps/docs`              | Documentation site (Astro Starlight)              |
| `@repo/backlog-utils` | `packages/backlog-utils` | Backlog API client wrapper                        |
| `@repo/cli-utils`     | `packages/cli-utils`     | Shared CLI utilities (output formatting, prompts) |
| `@repo/config`        | `packages/config`        | Configuration management                          |
| `@repo/test-utils`    | `packages/test-utils`    | Shared test helpers                               |
| `@repo/tsconfigs`     | `packages/tsconfigs`     | Shared TypeScript config                          |

### Scripts

```sh
pnpm install                       # Install dependencies
pnpm run typecheck                 # Type check all packages (tsc via turbo)
pnpm run test                      # Run all tests (vitest)
pnpm run lint                      # Lint (oxlint)
pnpm run format:check              # Check formatting (oxfmt)
pnpm --filter @nulab/bee build     # Build CLI
pnpm --filter @nulab/bee dev       # Run CLI in dev mode
```

Lint and format run automatically on staged files at commit time via [lefthook](https://github.com/evilmartians/lefthook). You typically only need to run `typecheck` and `test` manually.

## License

MIT
