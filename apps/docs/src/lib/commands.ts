import { readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLI_COMMANDS_DIR = resolve(__dirname, "../../../cli/src/commands");

type CommandEntry = {
  id: string;
  title: string;
  description: string;
  long?: string;
  parent: string;
  name: string;
  args: {
    name: string;
    type?: "string" | "boolean" | "positional";
    description?: string;
    alias: string[];
    default?: string | boolean;
    required?: boolean;
    valueHint?: string;
  }[];
  examples?: { description: string; command: string }[];
  environment?: [string, string][];
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
    name,
    type: def.type as NormalizedArg["type"],
    description: def.description as string | undefined,
    alias: toAliasArray(def.alias),
    default: def.default as string | boolean | undefined,
    required: def.required as boolean | undefined,
    valueHint: def.valueHint as string | undefined,
  }));

type NormalizedArg = CommandEntry["args"][number];

const buildUsageLine = (title: string, args: NormalizedArg[]): string => {
  const flags = args.filter((a) => a.type !== "positional");
  const positionals = args.filter((a) => a.type === "positional");
  const parts: string[] = [];
  if (flags.length > 0) {
    parts.push("[flags]");
  }
  for (const arg of positionals) {
    const name = arg.name.toUpperCase();
    parts.push(arg.required !== false && arg.default === undefined ? `<${name}>` : `[${name}]`);
  }
  return `${title} ${parts.join(" ")}`.trim();
};

const buildFlagParts = (arg: NormalizedArg): string[] => {
  const parts: string[] = arg.alias.map((a) => `-${a}`);
  let hint = "";
  if (arg.type === "string") {
    hint = arg.valueHint ? ` ${arg.valueHint}` : " <string>";
  }
  parts.push(`--${arg.name}${hint}`);
  return parts;
};

let cached: Promise<CommandEntry[]> | undefined;

const loadCommands = (): Promise<CommandEntry[]> => {
  cached ??= loadCommandsImpl();
  return cached;
};

const loadCommandsImpl = async (): Promise<CommandEntry[]> => {
  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    fsCache: false,
  });

  const results: CommandEntry[] = [];

  const entries = await readdir(CLI_COMMANDS_DIR, { withFileTypes: true });
  const subdirs = entries.filter((e) => e.isDirectory());

  for (const subdir of subdirs) {
    const parent = subdir.name;
    const dirPath = resolve(CLI_COMMANDS_DIR, parent);
    const files = await readdir(dirPath);

    const commandFiles = files.filter(
      (f) => f.endsWith(".ts") && f !== "index.ts" && !f.endsWith(".test.ts"),
    );

    for (const file of commandFiles) {
      const filePath = resolve(dirPath, file);
      const commandName = basename(file, ".ts");
      const id = `${parent}/${commandName}`;

      const entry = await loadCommandEntry(jiti, filePath, {
        id,
        parent,
        commandName,
        titlePrefix: `bee ${parent}`,
      });
      if (entry) {
        results.push(entry);
      }
    }
  }

  // Top-level command files (e.g. dashboard.ts, browse.ts)
  const topLevelFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith(".ts") && !e.name.endsWith(".test.ts"),
  );

  for (const file of topLevelFiles) {
    const filePath = resolve(CLI_COMMANDS_DIR, file.name);
    const commandName = basename(file.name, ".ts");

    const entry = await loadCommandEntry(jiti, filePath, {
      id: commandName,
      parent: "",
      commandName,
      titlePrefix: "bee",
    });
    if (entry) {
      results.push(entry);
    }
  }

  return results;
};

const loadCommandEntry = async (
  jiti: ReturnType<typeof createJiti>,
  filePath: string,
  opts: { id: string; parent: string; commandName: string; titlePrefix: string },
): Promise<CommandEntry | undefined> => {
  try {
    const mod = (await jiti.import(filePath)) as Record<string, unknown>;

    const commandUsage = mod.commandUsage as
      | {
          long?: string;
          examples?: { description: string; command: string }[];
          annotations?: {
            arguments?: string;
            environment?: [string, string][];
          };
        }
      | undefined;

    // Find the command definition: an exported object with a `.meta` property
    let meta: { name?: string; description?: string } | undefined;
    let args: Record<string, Record<string, unknown>> = {};

    for (const value of Object.values(mod)) {
      if (value !== null && typeof value === "object" && "meta" in value) {
        const cmdDef = value as {
          meta: { name?: string; description?: string };
          args?: Record<string, Record<string, unknown>>;
        };
        ({ meta } = cmdDef);
        args = cmdDef.args ?? {};
        break;
      }
    }

    if (!meta) {
      return undefined;
    }

    return {
      id: opts.id,
      title: `${opts.titlePrefix} ${meta.name ?? opts.commandName}`,
      description: meta.description ?? "",
      long: commandUsage?.long,
      parent: opts.parent,
      name: meta.name ?? opts.commandName,
      args: normalizeArgs(args),
      examples: commandUsage?.examples,
      environment: commandUsage?.annotations?.environment,
    };
  } catch {
    // Skip commands that fail to load
    return undefined;
  }
};

export { buildFlagParts, buildUsageLine, loadCommands };
export type { CommandEntry, NormalizedArg };
