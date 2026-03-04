import { readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLI_COMMANDS_DIR = resolve(__dirname, "../../../cli/src/commands");

type NormalizedArg = {
  name: string;
  type?: "string" | "boolean" | "positional";
  description?: string;
  alias: string[];
  default?: string | boolean;
  required?: boolean;
  valueHint?: string;
};

type CommandEntry = {
  id: string;
  title: string;
  description: string;
  long?: string;
  parent: string;
  name: string;
  args: NormalizedArg[];
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

const loadCommands = async (): Promise<CommandEntry[]> => {
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
          continue;
        }

        results.push({
          id,
          title: `bl ${parent} ${meta.name ?? commandName}`,
          description: meta.description ?? "",
          long: commandUsage?.long,
          parent,
          name: meta.name ?? commandName,
          args: normalizeArgs(args),
          examples: commandUsage?.examples,
          environment: commandUsage?.annotations?.environment,
        });
      } catch {
        // Skip commands that fail to load
      }
    }
  }

  return results;
};

export { loadCommands };
export type { CommandEntry };
