import * as v from "valibot";
import consola from "consola";
import { readUser, writeUser } from "rc9";
import type { Rc } from "./schema";
import { RcSchema } from "./schema";

const CONFIG_FILE_NAME = ".backlogrc";

const loadConfig = (): Rc => {
  const raw = readUser(CONFIG_FILE_NAME);
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

const writeConfig = (config: Rc): void => {
  writeUser(config, CONFIG_FILE_NAME);
};

const updateConfig = (updater: (config: Rc) => Rc): Rc => {
  const config = loadConfig();
  const updated = updater(config);
  writeConfig(updated);
  return updated;
};

export { loadConfig, updateConfig, writeConfig };
