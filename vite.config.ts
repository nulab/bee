import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    plugins: ["import", "typescript", "unicorn"],
    categories: {
      correctness: "error",
      suspicious: "warn",
      style: "warn",
    },
    rules: {
      // ── ESLint: Style overrides ─────────────────────────────────
      // Arrow functions: concise body when possible
      "arrow-body-style": ["warn", "as-needed"],
      // Always require curly braces for control statements
      curly: ["warn", "all"],
      // Prefer template literals over string concatenation
      "prefer-template": "warn",
      // Disable noisy/overly strict style rules
      "capitalized-comments": "off",
      "sort-keys": "off",
      "sort-imports": "off",
      "no-magic-numbers": "off",
      "id-length": "off",
      "max-params": "off",
      "max-statements": "off",
      "no-continue": "off",
      "no-ternary": "off",
      "func-names": "off",
      "vars-on-top": "off",
      "init-declarations": "off",
      "no-inline-comments": "off",
      "one-var": "off",
      "prefer-named-capture-group": "off",
      "no-underscore-dangle": "off",
      // Tests mock constructors with `vi.fn(function () {...})`; arrows are not constructible
      "prefer-arrow-callback": "off",
      // Nested matchers (expect.arrayContaining) and valibot schemas exceed the limit by design
      "unicorn/max-nested-calls": "off",
      // CLI tool uses Node.js modules (prefer-node-protocol handles the node: prefix)
      "import/no-nodejs-modules": "off",

      // ── ESLint: Pedantic (individual enable) ────────────────────
      // Strict equality only
      eqeqeq: ["warn", "always"],
      // Early return: no else after return
      "no-else-return": "warn",
      // Flatten else { if } to else if
      "no-lonely-if": "warn",
      // Prefer positive conditions: if (a) {} else {} over if (!a) {} else {}
      "no-negated-condition": "warn",

      // ── ESLint: Restriction (individual enable) ─────────────────
      // No var, use let/const
      "no-var": "warn",
      // No implicit coercion: Boolean(x) instead of !!x
      "no-implicit-coercion": "warn",

      // ── TypeScript: Style overrides ─────────────────────────────
      // Array type: T[] instead of Array<T>
      "typescript/array-type": ["warn", { default: "array" }],
      // Type definitions: use type instead of interface
      "typescript/consistent-type-definitions": ["warn", "type"],
      // Enforce inline type imports: import { type Foo, bar } instead of separate import type
      "typescript/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Indexed object style: Record<K, V> instead of { [key: K]: V }
      "typescript/consistent-indexed-object-style": ["warn", "record"],
      // Generic constructors: const x = new Foo<T>() instead of const x: Foo<T> = new Foo()
      "typescript/consistent-generic-constructors": ["warn", "constructor"],
      // Type assertions: x as T instead of <T>x
      "typescript/consistent-type-assertions": ["warn", { assertionStyle: "as" }],

      // ── TypeScript: Pedantic (individual enable) ────────────────
      // .includes() instead of .indexOf() !== -1
      "typescript/prefer-includes": "warn",
      // ?? instead of || for nullish
      "typescript/prefer-nullish-coalescing": "warn",

      // ── TypeScript: Restriction (individual enable) ──────────────
      // Consistent non-null assertion style
      "typescript/non-nullable-type-assertion-style": "warn",
      // No require() imports
      "typescript/no-require-imports": "warn",

      // ── TypeScript: Nursery (individual enable) ──────────────────
      // Optional chaining: foo?.bar instead of foo && foo.bar
      "typescript/prefer-optional-chain": "warn",
      // export type for type-only exports
      "typescript/consistent-type-exports": "warn",
      // obj.prop instead of obj["prop"]
      "typescript/dot-notation": "warn",

      // ── TypeScript: Type-aware rules ──
      // Disabled: oxlint's type checker cannot reliably resolve types across
      // workspace packages, causing widespread false positives. Type safety is
      // covered by `typeCheck` below, which reports compiler diagnostics only.
      "typescript/no-floating-promises": "off",
      "typescript/no-misused-promises": "off",
      "typescript/await-thenable": "off",
      "typescript/return-await": "off",
      "typescript/no-unnecessary-type-assertion": "off",
      "typescript/no-unnecessary-condition": "off",
      "typescript/no-unsafe-argument": "off",
      "typescript/no-unsafe-assignment": "off",
      "typescript/no-unsafe-call": "off",
      "typescript/no-unsafe-member-access": "off",
      "typescript/no-unsafe-return": "off",
      // Enabling `typeAware` (required by `typeCheck`, which replaces `tsc
      // --noEmit`) also switched these category rules on for the first time.
      // They flag established patterns -- casting commander's `any` options,
      // `String#match` -- across dozens of files; adopting them is a code-wide
      // change of its own, not part of the toolchain swap.
      "typescript/no-unsafe-type-assertion": "off",
      "typescript/prefer-regexp-exec": "off",
      "typescript/restrict-template-expressions": "off",

      // ── Unicorn: Style overrides ────────────────────────────────
      // Don't ban null (external API compatibility)
      "unicorn/no-null": "off",
      // Consistent catch variable name: error
      "unicorn/catch-error-name": ["warn", { name: "error" }],

      // ── Unicorn: Pedantic (individual enable) ────────────────────
      // .length > 0 explicitly instead of truthy check
      "unicorn/explicit-length-check": "warn",
      // .some() instead of .find() !== undefined
      "unicorn/prefer-array-some": "warn",
      // .at(-1) instead of arr[arr.length - 1]
      "unicorn/prefer-at": "warn",
      // .codePointAt() instead of .charCodeAt()
      "unicorn/prefer-code-point": "warn",
      // Date.now() instead of new Date().getTime()
      "unicorn/prefer-date-now": "warn",
      // Math.min/max instead of ternary
      "unicorn/prefer-math-min-max": "warn",
      // Math.trunc() instead of bitwise
      "unicorn/prefer-math-trunc": "warn",
      // RegExp#test() instead of String#match()
      "unicorn/prefer-regexp-test": "warn",
      // .replaceAll() instead of .replace(/g)
      "unicorn/prefer-string-replace-all": "warn",
      // .slice() instead of .substring()
      "unicorn/prefer-string-slice": "warn",
      // assert.ok() instead of assert()
      "unicorn/consistent-assert": "warn",

      // ── Unicorn: Restriction (individual enable) ─────────────────
      // for...of instead of .forEach()
      "unicorn/no-array-for-each": "warn",
      // Number.parseInt() instead of parseInt()
      "unicorn/prefer-number-properties": "warn",
      // ESM only
      "unicorn/prefer-module": "warn",

      // ── Import: Restriction (individual enable) ──────────────────
      // Named exports only, no default export
      "import/no-default-export": "warn",
      // Conflicts with no-default-export; disable the opposite rule enabled by categories.style
      "import/no-named-export": "off",
      // ESM only, no require/module.exports
      "import/no-commonjs": "warn",

      // ── Import: Style overrides ────────────────────────────────
      // Allow namespace imports (e.g., import * as v from "valibot")
      "import/no-namespace": "off",
      // Inline type imports eliminate the need for separate import type statements
      "no-duplicate-imports": "warn",
      // Prefer inline type specifiers: import { type Foo } instead of import type { Foo }
      "import/consistent-type-specifier-style": ["warn", "prefer-inline"],
      // Allow default-as-named (false positive for consola etc.)
      "import/no-named-as-default": "off",
      // Conflicts with no-default-export
      "import/prefer-default-export": "off",
    },
    overrides: [
      {
        // Tool config files require default exports
        files: ["**/astro.config.*", "**/vite.config.*"],
        rules: {
          "import/no-default-export": "off",
          "import/no-anonymous-default-export": "off",
        },
      },
      {
        // Astro pages have exports in frontmatter before the template
        files: ["**/*.astro"],
        rules: {
          "import/exports-last": "off",
        },
      },
      {
        // CLI entry point uses side-effect import
        files: ["**/bin/**"],
        rules: {
          "import/no-unassigned-import": "off",
        },
      },
      {
        // Test files reference mock functions as unbound methods (e.g., expect(obj.method))
        // which is safe and expected in Vitest assertions.
        // Type assertions (as never, as unknown as T) are common patterns for mocking
        // return values and constructing test fixtures.
        files: ["**/*.test.ts"],
        rules: {
          "typescript/unbound-method": "off",
          "typescript/no-unsafe-type-assertion": "off",
        },
      },
      {
        // oxlint's type checker cannot reliably resolve types across workspace
        // packages, causing false positives in command files.
        // Commander's addCommands() requires default exports from command modules.
        files: ["apps/cli/src/commands/**"],
        rules: {
          "typescript/no-redundant-type-constituents": "off",
          "import/no-default-export": "off",
        },
      },
    ],
    settings: {
      vitest: {
        typecheck: false,
      },
    },
    env: {
      builtin: true,
    },
    globals: {},
    // Astro virtual modules (`astro:content`, `import.meta.glob`) only get
    // types from what `astro sync` generates, so type-checking the docs app
    // here reports errors that `astro build` itself never hits.
    ignorePatterns: ["apps/docs/**"],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: ["**/*.mdx", "pnpm-lock.yaml"],
  },
  staged: {
    "*": "vp check --fix",
  },
  test: {
    projects: ["packages/*", "apps/*", "!apps/docs"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportOnFailure: true,
      include: ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/index.ts", "apps/docs/**"],
    },
  },
});
