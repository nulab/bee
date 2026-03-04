import type { ArgsDef, CommandDef } from "citty";
import { showUsage as cittyShowUsage } from "citty";
import consola from "consola";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommandUsage = {
  long?: string;
  examples?: { description: string; command: string }[];
  annotations?: {
    arguments?: string;
    environment?: string;
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
export function withUsage<T extends ArgsDef>(
  cmd: CommandDef<T>,
  usage: CommandUsage,
): CommandDef<T> {
  (cmd as CommandDefWithUsage)[kUsage] = usage;
  return cmd;
}

/**
 * Retrieve the `CommandUsage` previously attached via `withUsage`.
 * Useful for documentation generation scripts that import command modules.
 */
export function getCommandUsage(cmd: CommandDef): CommandUsage | undefined {
  return (cmd as CommandDefWithUsage)[kUsage];
}

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
export function renderCommandUsage(usage: CommandUsage) {
  return async (cmd: CommandDef, parent?: CommandDef): Promise<void> => {
    const meta = await resolveValue(cmd.meta ?? {});
    const parentMeta = parent
      ? await resolveValue(parent.meta ?? {})
      : undefined;
    const args = normalizeArgs(await resolveValue(cmd.args ?? {}));

    const commandName =
      [parentMeta?.name, meta.name].filter(Boolean).join(" ") ||
      process.argv[1];

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
          arg.required !== false && arg.default === undefined
            ? `<${name}>`
            : `[${name}]`,
        );
      }
    }
    if (cmd.subCommands) {
      const subs = await resolveValue(cmd.subCommands);
      usageParts.push(Object.keys(subs).join("|"));
    }
    lines.push("USAGE");
    lines.push(`  ${commandName} ${usageParts.join(" ")}`);
    lines.push("");

    // -- ARGUMENTS (positional) ---------------------------------------------
    const positionals = args.filter((a) => a.type === "positional");
    if (positionals.length > 0) {
      lines.push("ARGUMENTS");
      const rows = positionals.map((a) => {
        const name = a.name.toUpperCase();
        const hint = a.default ? ` (default: "${a.default}")` : "";
        return [`  ${name}`, `${a.description ?? ""}${hint}`];
      });
      lines.push(...alignColumns(rows));
      lines.push("");
    }

    // -- FLAGS (non-positional) ---------------------------------------------
    if (flags.length > 0) {
      lines.push("FLAGS");
      lines.push(...formatFlags(flags));
      lines.push("");
    }

    // -- INHERITED FLAGS ----------------------------------------------------
    lines.push("INHERITED FLAGS");
    lines.push("  --help   Show help for command");
    lines.push("");

    // -- COMMANDS (subcommands) ---------------------------------------------
    if (cmd.subCommands) {
      const subs = await resolveValue(cmd.subCommands);
      const rows: string[][] = [];
      for (const [name, sub] of Object.entries(subs)) {
        const subCmd = await resolveValue(sub);
        const subMeta = subCmd ? await resolveValue(subCmd.meta ?? {}) : {};
        rows.push([`  ${name}`, subMeta?.description ?? ""]);
      }
      lines.push("COMMANDS");
      lines.push(...alignColumns(rows));
      lines.push("");
    }

    // -- annotations: arguments ---------------------------------------------
    if (usage.annotations?.arguments) {
      lines.push("ARGUMENTS");
      lines.push(indent(usage.annotations.arguments));
      lines.push("");
    }

    // -- EXAMPLES -----------------------------------------------------------
    if (usage.examples && usage.examples.length > 0) {
      lines.push("EXAMPLES");
      for (const ex of usage.examples) {
        lines.push(`  # ${ex.description}`);
        lines.push(`  $ ${ex.command}`);
        lines.push("");
      }
    }

    // -- ENVIRONMENT VARIABLES ----------------------------------------------
    if (usage.annotations?.environment) {
      lines.push("ENVIRONMENT VARIABLES");
      lines.push(indent(usage.annotations.environment));
      lines.push("");
    }

    // -- LEARN MORE ---------------------------------------------------------
    lines.push("LEARN MORE");
    lines.push(
      `  Use \`${commandName} <command> --help\` for more information about a command.`,
    );

    consola.log(lines.join("\n") + "\n");
  };
}

/**
 * `showUsage` replacement for `runMain`.
 *
 * If the resolved command has an attached `CommandUsage`, renders rich
 * gh-cli style help via the closure created by `renderCommandUsage`.
 * Otherwise falls back to citty's built-in `showUsage`.
 */
export async function showCommandUsage(
  cmd: CommandDef,
  parent?: CommandDef,
): Promise<void> {
  const usage = getCommandUsage(cmd);
  if (usage) {
    await renderCommandUsage(usage)(cmd, parent);
  } else {
    await cittyShowUsage(cmd, parent);
  }
}

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

async function resolveValue<T>(
  val: T | (() => T) | (() => Promise<T>) | Promise<T>,
): Promise<Awaited<T>> {
  if (typeof val === "function") {
    return (await (val as () => T | Promise<T>)()) as Awaited<T>;
  }
  return (await val) as Awaited<T>;
}

function normalizeArgs(
  argsDef: Record<string, Record<string, unknown>>,
): NormalizedArg[] {
  return Object.entries(argsDef).map(([name, def]) => ({
    ...(def as Omit<NormalizedArg, "name" | "alias">),
    name,
    alias: Array.isArray(def.alias)
      ? (def.alias as string[])
      : (def.alias
        ? [def.alias as string]
        : []),
  }));
}

function formatFlags(args: NormalizedArg[]): string[] {
  const rows: [string, string][] = args.map((arg) => {
    const short = arg.alias.map((a) => `-${a}`).join(", ");
    const long = `--${arg.name}`;
    const flag = short ? `${short}, ${long}` : `    ${long}`;

    let hint = "";
    if (arg.type === "string") {
      if (arg.valueHint) {
        hint = ` ${arg.valueHint}`;
      } else {
        hint = " string";
      }
    }

    const defaultSuffix =
      arg.default !== undefined ? ` (default: "${arg.default}")` : "";

    return [
      `  ${flag}${hint}`,
      `${arg.description ?? ""}${defaultSuffix}`,
    ];
  });

  return alignColumns(rows);
}

function alignColumns(rows: string[][]): string[] {
  if (rows.length === 0) {
    return [];
  }
  const maxLen = Math.max(...rows.map(([col]) => col.length));
  return rows.map(([col1, col2]) =>
    col2 ? `${col1.padEnd(maxLen + 3)}${col2}` : col1,
  );
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}
