import { chmodSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { UserError } from "@repo/cli-utils";
import * as v from "valibot";
import { readUser, writeUser } from "rc9";
import { type Rc, RcSchema } from "./schema";

const CONFIG_FILE_NAME = ".beerc";

const parseConfig = (raw: unknown): Rc => {
  const result = v.safeParse(RcSchema, raw);

  if (!result.success) {
    const details = result.issues.map((issue) => issue.message).join("\n");
    throw new UserError(`Configuration Error:\n${details}`);
  }

  return result.output;
};

const loadConfig = (): Rc => parseConfig(readUser(CONFIG_FILE_NAME));

const configFilePath = (): string =>
  resolve(process.env.XDG_CONFIG_HOME || homedir(), CONFIG_FILE_NAME);

/**
 * Validates before writing rather than trusting the caller, so an invalid host
 * cannot be persisted by a command that writes the rc file directly (such as
 * `bee auth login`) only to break every later read.
 */
const writeConfig = (config: Rc): void => {
  writeUser(parseConfig(config), CONFIG_FILE_NAME);
  chmodSync(configFilePath(), 0o600);
};

const updateConfig = (updater: (config: Rc) => Rc): Rc => {
  const config = loadConfig();
  const updated = updater(config);
  writeConfig(updated);
  return updated;
};

export { loadConfig, updateConfig, writeConfig };
