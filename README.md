# Backlog CLI

[![CI](https://img.shields.io/github/actions/workflow/status/nulab/bee/ci.yml?style=for-the-badge&logo=github&label=CI)](https://github.com/nulab/bee/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/nulab/bee/codeql.yml?style=for-the-badge&logo=github&label=CodeQL)](https://github.com/nulab/bee/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/@nulab/bee?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@nulab/bee)
[![node](https://img.shields.io/node/v/@nulab/bee?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![last commit](https://img.shields.io/github/last-commit/nulab/bee?style=for-the-badge&logo=github)](https://github.com/nulab/bee/commits/main)
[![license](https://img.shields.io/github/license/nulab/bee?style=for-the-badge&logo=opensourceinitiative)](LICENSE)

Command-line tool to view and manage [Backlog](https://backlog.com/), inspired by GitHub CLI.

> [!NOTE]
> This is not an officially supported Nulab product. It is maintained by volunteers.

**Looking to install and use bee?** See the [CLI package README](apps/cli/README.md) or the [documentation site](https://nulab.github.io).

## Development

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

For setup instructions, scripts, and contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
