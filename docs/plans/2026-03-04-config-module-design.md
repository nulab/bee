# Config Module Design

## Overview

`@repo/config` パッケージは、Backlog CLI の設定ファイルの読み書き・バリデーション・スペース管理を担当するモジュール。

参照実装: `simochee/backlog-cli/packages/config`

## Config File

- **Path**: `$XDG_CONFIG_HOME/backlog/.backlogrc` (default: `~/.config/backlog/.backlogrc`)
- **Format**: rc9 INI-style flat format
- **Library**: rc9 (`read`/`write` with explicit `dir`)

## Package Structure

```
packages/config/
├── src/
│   ├── index.ts          # Public API exports
│   ├── schema.ts         # Valibot schemas + type exports
│   ├── config.ts         # loadConfig / writeConfig
│   ├── space.ts          # Space CRUD + resolution
│   ├── schema.test.ts
│   ├── config.test.ts
│   └── space.test.ts
├── package.json          # @repo/config
├── tsconfig.json
├── build.config.ts
└── vitest.config.ts
```

## Dependencies

- **runtime**: `valibot`, `rc9`, `consola`
- **dev**: `vitest`, `@repo/tsconfigs`

## Schema (Valibot)

- **RcAuth**: API Key / OAuth discriminated union on `method`
- **RcSpace**: `host` (regex `/^[a-z0-9-]+\.backlog\.(com|jp)$/`) + `auth`
- **Rc**: `defaultSpace?`, `spaces[]` (default `[]`), `aliases` (default `{}`)

## Public API

- `loadConfig()` / `writeConfig(config)` — Config I/O with XDG support
- `addSpace` / `removeSpace` / `updateSpaceAuth` / `findSpace` / `resolveSpace`
- `type Rc`, `type RcAuth`, `type RcSpace`

## Space Resolution Priority

1. Explicit host argument → 2. `BACKLOG_SPACE` env → 3. `defaultSpace`

## Design Decisions

1. **Valibot over arktype**: Tree-shakeable, lighter bundle
2. **rc9 `read`/`write` with custom dir**: XDG support via `$XDG_CONFIG_HOME/backlog/`
3. **`schema.ts` naming**: Describes "Valibot schemas + types" better than `types.ts`
4. **Collocated tests**: `.test.ts` suffix next to source
5. **Named exports only**: Per oxlint rules
6. **`type` over `interface`**: Per oxlint rules
