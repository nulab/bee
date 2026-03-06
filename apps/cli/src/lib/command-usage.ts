import { type ArgsDef, type CommandDef, showUsage as cittyShowUsage } from "citty";
import consola from "consola";
import { colorize } from "consola/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommandUsage = {
  long?: string;
  examples?: { description: string; command: string }[];
  annotations?: {
    arguments?: string;
    environment?: [string, string][];
  };
};

// ---------------------------------------------------------------------------
// Attach / retrieve usage on a command object (no global registry)
// ---------------------------------------------------------------------------

const kUsage: unique symbol = Symbol("commandUsage");

type CommandDefWithUsage = CommandDef & { [kUsage]?: CommandUsage };

/**
 * Attach a `CommandUsage` to a citty `CommandDef`.
 *
 * The usage object is stored directly on the command via a private Symbol,
 * so no global registry is needed.
 */
const withUsage = <T extends ArgsDef>(cmd: CommandDef<T>, usage: CommandUsage): CommandDef<T> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- intentional: attaching metadata via symbol key
  (cmd as CommandDefWithUsage)[kUsage] = usage;
  return cmd;
};

/**
 * Retrieve the `CommandUsage` previously attached via `withUsage`.
 * Useful for documentation generation scripts that import command modules.
 */
const getCommandUsage = (cmd: CommandDef): CommandUsage | undefined =>
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- intentional: reading metadata via symbol key
  (cmd as CommandDefWithUsage)[kUsage];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

type NormalizedArg = {
  name: string;
  type?: "boolean" | "string" | "positional";
  description?: string;
  alias: string[];
  default?: string | boolean;
  required?: boolean;
  valueHint?: string;
};

/**
 * Create a `showUsage`-compatible closure that renders gh-cli style help
 * for the given `CommandUsage`.
 */
const renderCommandUsage =
  (usage: CommandUsage) =>
  async (cmd: CommandDef, parent?: CommandDef): Promise<void> => {
    const meta = await resolveValue(cmd.meta ?? {});
    const parentMeta = parent ? await resolveValue(parent.meta ?? {}) : undefined;
    const args = normalizeArgs(await resolveValue(cmd.args ?? {}));

    const commandName = [parentMeta?.name, meta.name].filter(Boolean).join(" ") || process.argv[1];

    const lines: string[] = [];

    // -- Description --------------------------------------------------------
    lines.push(usage.long ?? meta.description ?? "");
    lines.push("");

    // -- USAGE --------------------------------------------------------------
    const usageParts: string[] = [];
    const flags = args.filter((a) => a.type !== "positional");
    if (flags.length > 0) {
      usageParts.push("[flags]");
    }
    for (const arg of args) {
      if (arg.type === "positional") {
        const name = arg.name.toUpperCase();
        usageParts.push(
          arg.required !== false && arg.default === undefined ? `<${name}>` : `[${name}]`,
        );
      }
    }
    if (cmd.subCommands) {
      const subs = await resolveValue(cmd.subCommands);
      usageParts.push(Object.keys(subs).join("|"));
    }
    lines.push(colorize("bold", "USAGE"));
    lines.push(`  ${commandName} ${usageParts.join(" ")}`);
    lines.push("");

    // -- ARGUMENTS (positional) ---------------------------------------------
    const positionals = args.filter((a) => a.type === "positional");
    if (positionals.length > 0) {
      lines.push(colorize("bold", "ARGUMENTS"));
      const rows = positionals.map((a) => {
        const name = a.name.toUpperCase();
        const valueSuffix = a.valueHint ? ` ${a.valueHint}` : "";
        const hint = a.default ? ` (default: "${a.default}")` : "";
        return [`  ${name}`, `${a.description ?? ""}${valueSuffix}${hint}`];
      });
      lines.push(...alignColumns(rows));
      lines.push("");
    }

    // -- FLAGS (non-positional) ---------------------------------------------
    if (flags.length > 0) {
      lines.push(colorize("bold", "FLAGS"));
      lines.push(...formatFlags(flags));
      lines.push("");
    }

    // -- INHERITED FLAGS ----------------------------------------------------
    lines.push(colorize("bold", "INHERITED FLAGS"));
    lines.push("  --help   Show help for command");
    lines.push("");

    // -- COMMANDS (subcommands) ---------------------------------------------
    if (cmd.subCommands) {
      const subs = await resolveValue(cmd.subCommands);
      const rows: string[][] = [];
      for (const [name, sub] of Object.entries(subs)) {
        const subCmd = await resolveValue(sub);
        const subMeta = await resolveValue(subCmd.meta ?? {});
        rows.push([`  ${name}`, subMeta.description ?? ""]);
      }
      lines.push(colorize("bold", "COMMANDS"));
      lines.push(...alignColumns(rows));
      lines.push("");
    }

    // -- annotations: arguments ---------------------------------------------
    if (usage.annotations?.arguments) {
      lines.push(colorize("bold", "ARGUMENTS"));
      lines.push(indent(usage.annotations.arguments));
      lines.push("");
    }

    // -- EXAMPLES -----------------------------------------------------------
    if (usage.examples && usage.examples.length > 0) {
      lines.push(colorize("bold", "EXAMPLES"));
      for (const ex of usage.examples) {
        lines.push(`  # ${ex.description}`);
        lines.push(`  $ ${ex.command}`);
        lines.push("");
      }
    }

    // -- ENVIRONMENT VARIABLES ----------------------------------------------
    if (usage.annotations?.environment && usage.annotations.environment.length > 0) {
      lines.push(colorize("bold", "ENVIRONMENT VARIABLES"));
      lines.push(
        ...alignColumns(usage.annotations.environment.map(([key, desc]) => [`  ${key}`, desc])),
      );
      lines.push("");
    }

    // -- LEARN MORE ---------------------------------------------------------
    lines.push(colorize("bold", "LEARN MORE"));
    lines.push(`  Use \`${commandName} <command> --help\` for more information about a command.`);

    consola.log(`${lines.join("\n")}\n`);
  };

/**
 * `showUsage` replacement for `runMain`.
 *
 * If the resolved command has an attached `CommandUsage`, renders rich
 * gh-cli style help via the closure created by `renderCommandUsage`.
 * Otherwise falls back to citty's built-in `showUsage`.
 */
const showCommandUsage = async <T extends ArgsDef>(
  cmd: CommandDef<T>,
  parent?: CommandDef<T>,
): Promise<void> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- generic CommandDef<T> is structurally compatible for metadata read
  const resolved = cmd as CommandDef;
  const usage = getCommandUsage(resolved);
  await (usage
    ? // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- generic CommandDef<T> is structurally compatible for rendering
      renderCommandUsage(usage)(resolved, parent as CommandDef)
    : cittyShowUsage(cmd, parent));
};

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

const resolveValue = async <T>(
  val: T | (() => T) | (() => Promise<T>) | Promise<T>,
): Promise<Awaited<T>> => {
  if (typeof val === "function") {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- generic function cast required
    return await (val as () => T | Promise<T>)();
  }
  return await val;
};

const toAliasArray = (alias: unknown): string[] => {
  if (Array.isArray(alias)) {
    return alias.map(String);
  }
  if (typeof alias === "string") {
    return [alias];
  }
  return [];
};

const normalizeArgs = (argsDef: Record<string, Record<string, unknown>>): NormalizedArg[] =>
  Object.entries(argsDef).map(([name, def]) => ({
    ...(def as Omit<NormalizedArg, "name" | "alias">),
    name,
    alias: toAliasArray(def.alias),
  }));

const formatFlags = (args: NormalizedArg[]): string[] => {
  const rows: [string, string][] = args.map((arg) => {
    const short = arg.alias.map((a) => `-${a}`).join(", ");
    const long = `--${arg.name}`;
    const flag = short ? `${short}, ${long}` : `    ${long}`;

    let hint = "";
    if (arg.type === "string") {
      hint = arg.valueHint ? ` ${arg.valueHint}` : " string";
    }

    const defaultSuffix = arg.default === undefined ? "" : ` (default: "${arg.default}")`;

    return [`  ${flag}${hint}`, `${arg.description ?? ""}${defaultSuffix}`];
  });

  return alignColumns(rows);
};

const alignColumns = (rows: string[][]): string[] => {
  if (rows.length === 0) {
    return [];
  }
  const maxLen = Math.max(...rows.map(([col]) => col.length));
  return rows.map(([col1, col2]) => (col2 ? `${col1.padEnd(maxLen + 3)}${col2}` : col1));
};

const indent = (text: string): string =>
  text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");

// ---------------------------------------------------------------------------
// Shared environment variable entries
// ---------------------------------------------------------------------------

const ENV_AUTH: [string, string][] = [
  ["BACKLOG_API_KEY", "Authenticate with an API key"],
  ["BACKLOG_SPACE", "Default space hostname"],
];

const ENV_PROJECT: [string, string] = ["BACKLOG_PROJECT", "Default project ID or project key"];

const ENV_REPO: [string, string] = ["BACKLOG_REPO", "Default repository name"];

export {
  type CommandUsage,
  withUsage,
  getCommandUsage,
  renderCommandUsage,
  showCommandUsage,
  ENV_AUTH,
  ENV_PROJECT,
  ENV_REPO,
};
