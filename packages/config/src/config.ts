import { homedir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import consola from "consola";
import { read, write } from "rc9";
import { RcSchema } from '#/schema.js';
import type { Rc } from '#/schema.js';

const CONFIG_DIR_NAME = "backlog";
const CONFIG_FILE_NAME = ".backlogrc";

const resolveConfigDir = (): string => {
  const xdgConfigHome = process.env["XDG_CONFIG_HOME"];
  const base = xdgConfigHome ?? join(homedir(), ".config");
  return join(base, CONFIG_DIR_NAME);
};

export const loadConfig = (): Rc => {
  const dir = resolveConfigDir();
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

export const writeConfig = (config: Rc): void => {
  const dir = resolveConfigDir();
  write(config, { name: CONFIG_FILE_NAME, dir });
};
