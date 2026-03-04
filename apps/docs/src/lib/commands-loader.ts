import { readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import type { Loader } from "astro/loaders";
import { createJiti } from "jiti";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLI_COMMANDS_DIR = resolve(__dirname, "../../../cli/src/commands");

const argSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "boolean", "positional"]).optional(),
  description: z.string().optional(),
  alias: z.array(z.string()),
  default: z.union([z.string(), z.boolean()]).optional(),
  required: z.boolean().optional(),
  valueHint: z.string().optional(),
});

const commandEntrySchema = z.object({
  title: z.string(),
  description: z.string(),
  long: z.string().optional(),
  parent: z.string(),
  name: z.string(),
  args: z.array(argSchema),
  examples: z.array(z.object({ description: z.string(), command: z.string() })).optional(),
  environment: z.array(z.tuple([z.string(), z.string()])).optional(),
});

type NormalizedArg = z.infer<typeof argSchema>;

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

const commandsLoader = (): Loader => ({
  name: "commands-loader",
  load: async (context) => {
    const { store, logger } = context;
    const jiti = createJiti(import.meta.url, {
      moduleCache: false,
      fsCache: false,
    });

    store.clear();

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
            logger.warn(`No command definition found in ${id}, skipping`);
            continue;
          }

          const data = {
            title: `bl ${parent} ${meta.name ?? commandName}`,
            description: meta.description ?? "",
            long: commandUsage?.long,
            parent,
            name: meta.name ?? commandName,
            args: normalizeArgs(args),
            examples: commandUsage?.examples,
            environment: commandUsage?.annotations?.environment,
          };

          store.set({ id, data });
          logger.info(`Loaded command: ${id}`);
        } catch (error) {
          logger.warn(
            `Failed to load command ${id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  },
});

export { commandEntrySchema, commandsLoader };
