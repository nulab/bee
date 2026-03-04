import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import consola from "consola";
import { read, write } from "rc9";
import type { Rc } from "./schema";
import { RcSchema } from "./schema";

const CONFIG_DIR_NAME = "backlog";
const CONFIG_FILE_NAME = ".backlogrc";

const resolveConfigDir = (): string => {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  const base = xdgConfigHome ?? join(homedir(), ".config");
  return join(base, CONFIG_DIR_NAME);
};

const loadConfig = (): Rc => {
  const dir = resolveConfigDir();
  ensureConfigDir(dir);
  const raw = read({ name: CONFIG_FILE_NAME, dir });
  const result = v.safeParse(RcSchema, raw);

  if (!result.success) {
    consola.error("Configuration Error:");
    for (const issue of result.issues) {
      consola.error(issue.message);
    }
    process.exit(1);
  }

  return result.output;
};

const ensureConfigDir = (dir: string): void => {
  if (existsSync(dir) && !statSync(dir).isDirectory()) {
    const oldContent = readFileSync(dir, "utf8");
    unlinkSync(dir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, CONFIG_FILE_NAME), oldContent, "utf8");
    return;
  }
  mkdirSync(dir, { recursive: true });
};

const writeConfig = (config: Rc): void => {
  const dir = resolveConfigDir();
  ensureConfigDir(dir);
  write(config, { name: CONFIG_FILE_NAME, dir });
};

export { loadConfig, writeConfig };
