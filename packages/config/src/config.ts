import { UserError } from "@repo/cli-utils";
import * as v from "valibot";
import { readUser, writeUser } from "rc9";
import { type Rc, RcSchema } from "./schema";

const CONFIG_FILE_NAME = ".backlogrc";

const loadConfig = (): Rc => {
  const raw = readUser(CONFIG_FILE_NAME);
  const result = v.safeParse(RcSchema, raw);

  if (!result.success) {
    const details = result.issues.map((issue) => issue.message).join("\n");
    throw new UserError(`Configuration Error:\n${details}`);
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
