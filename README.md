# bee

[![CI](https://img.shields.io/github/actions/workflow/status/nulab/bee/ci.yml?logo=github&label=CI)](https://github.com/nulab/bee/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/nulab/bee/codeql.yml?logo=github&label=CodeQL)](https://github.com/nulab/bee/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/@nulab/bee?logo=npm)](https://www.npmjs.com/package/@nulab/bee)
[![npm last publish](https://img.shields.io/npm/last-update/@nulab/bee?logo=npm&label=last%20publish)](https://www.npmjs.com/package/@nulab/bee)
[![node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?logo=nodedotjs)](https://nodejs.org/)
[![license](https://img.shields.io/github/license/nulab/bee?logo=opensourceinitiative)](LICENSE)

Bring [Backlog](https://backlog.com/) to your command line.

> [!NOTE]
> This is not an officially supported Nulab product. It is maintained by volunteers.

**Looking to install and use bee?** See the [CLI package README](apps/cli/README.md) or the [documentation site](https://nulab.github.io/bee).

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
