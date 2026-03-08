import { type Command, Option } from "commander";
import { promptRequired } from "@repo/cli-utils";

class RequiredOption extends Option {
  promptLabel: string;

  constructor(flags: string, description: string, promptLabel?: string) {
    super(flags, `${description} (required)`);
    this.promptLabel = promptLabel ?? description;
  }
}

const resolveOptions = async (cmd: Command): Promise<Record<string, unknown>> => {
  const opts = cmd.opts();
  for (const opt of cmd.options) {
    if (opt instanceof RequiredOption) {
      const key = opt.attributeName();
      opts[key] = await promptRequired(`${opt.promptLabel}:`, opts[key]);
    }
  }
  return opts;
};

export { RequiredOption, resolveOptions };
