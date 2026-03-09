import { readFile, readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { type Command, type Option } from "commander";

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

/** Extract the long option name from commander's Option (e.g. "--project" → "project"). */
const longName = (opt: Option): string => (opt.long ?? opt.short ?? "").replace(/^-+/, "");

/** Extract the short alias (without leading dash) if present. */
const shortAlias = (opt: Option): string[] => (opt.short ? [opt.short.replace(/^-/, "")] : []);

/** Extract the value placeholder from a commander Option's flags string (e.g. "<id>" from "-p, --project <id>"). */
const extractValueHint = (opt: Option): string | undefined => {
  const match = opt.flags.match(/<([^>]+)>|\[([^\]]+)\]/);
  return match ? `<${match[1] ?? match[2]}>` : undefined;
};

/**
 * Determine the arg type for a commander Option.
 * Boolean flags have no expected argument; otherwise treat as string.
 */
const optionArgType = (opt: Option): "boolean" | "string" =>
  opt.required || opt.optional ? "string" : "boolean";

/** Convert commander Options and Arguments into the normalized args format. */
const normalizeCommanderArgs = (cmd: Command): NormalizedArg[] => {
  const args: NormalizedArg[] = [];

  for (const opt of cmd.options) {
    args.push({
      name: longName(opt),
      type: optionArgType(opt),
      description: opt.description,
      alias: shortAlias(opt),
      default:
        typeof opt.defaultValue === "string" || typeof opt.defaultValue === "boolean"
          ? opt.defaultValue
          : undefined,
      required: opt.required || undefined,
      valueHint: extractValueHint(opt),
    });
  }

  for (const arg of cmd.registeredArguments) {
    args.push({
      name: arg.name(),
      type: "positional",
      description: arg.description,
      alias: [],
      default:
        typeof arg.defaultValue === "string" || typeof arg.defaultValue === "boolean"
          ? arg.defaultValue
          : undefined,
      required: arg.required,
    });
  }

  return args;
};

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

type ParentCommandMap = Map<string, string>;

let cached: Promise<CommandEntry[]> | undefined;
let cachedParents: Promise<ParentCommandMap> | undefined;

const loadCommands = (): Promise<CommandEntry[]> => {
  cached ??= loadCommandsImpl();
  return cached;
};

/** Load parent command summaries from index.ts files (e.g. "auth" → "Authenticate bee with Backlog"). */
const loadParentCommands = (): Promise<ParentCommandMap> => {
  cachedParents ??= loadParentCommandsImpl();
  return cachedParents;
};

const loadCommandsImpl = async (): Promise<CommandEntry[]> => {
  const jiti = createJiti(import.meta.url, {
    moduleCache: true,
    fsCache: true,
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

const isCommandLike = (value: unknown): value is Command =>
  value !== null &&
  typeof value === "object" &&
  typeof (value as Record<string, unknown>).name === "function" &&
  typeof (value as Record<string, unknown>).options === "object";

const loadCommandEntry = async (
  jiti: ReturnType<typeof createJiti>,
  filePath: string,
  opts: { id: string; parent: string; commandName: string; titlePrefix: string },
): Promise<CommandEntry | undefined> => {
  try {
    const mod = (await jiti.import(filePath)) as Record<string, unknown>;

    // The default export is a BeeCommand (commander.Command) instance
    const cmd = mod.default;
    if (!isCommandLike(cmd)) {
      return undefined;
    }

    const name = cmd.name() || opts.commandName;
    const summary = cmd.summary();
    const description = cmd.description();

    // BeeCommand exposes examples and env vars as public properties
    const beeCmd = cmd as Command & {
      beeExamples?: { description: string; command: string }[];
      beeEnvVars?: [string, string][];
    };
    const examples = beeCmd.beeExamples;
    const extraEnvVars = beeCmd.beeEnvVars;

    // Collect environment variables: from option .env() bindings + explicit .envVars()
    const envFromOptions: [string, string][] = cmd.options
      .filter((o: Option) => o.envVar)
      .map((o: Option) => [o.envVar!, o.description ?? ""]);
    const environment = [...envFromOptions, ...(extraEnvVars ?? [])];

    // Use summary as the short description; if description differs, use as long text
    const short = summary || description;
    const long = description && description !== summary ? description : undefined;

    return {
      id: opts.id,
      title: `${opts.titlePrefix} ${name}`,
      description: short,
      long,
      parent: opts.parent,
      name,
      args: normalizeCommanderArgs(cmd),
      examples: examples && examples.length > 0 ? examples : undefined,
      environment: environment.length > 0 ? environment : undefined,
    };
  } catch {
    // Skip commands that fail to load
    return undefined;
  }
};

const loadParentCommandsImpl = async (): Promise<ParentCommandMap> => {
  const result: ParentCommandMap = new Map();
  const entries = await readdir(CLI_COMMANDS_DIR, { withFileTypes: true });
  const subdirs = entries.filter((e) => e.isDirectory());

  for (const subdir of subdirs) {
    const indexPath = resolve(CLI_COMMANDS_DIR, subdir.name, "index.ts");
    try {
      const source = await readFile(indexPath, "utf8");
      const match = source.match(/\.summary\(["'`](.+?)["'`]\)/);
      if (match) {
        result.set(subdir.name, match[1]);
      }
    } catch {
      // Skip if index.ts doesn't exist
    }
  }

  return result;
};

export { buildFlagParts, buildUsageLine, loadCommands, loadParentCommands };
export type { CommandEntry, NormalizedArg };
