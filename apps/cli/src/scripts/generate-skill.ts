import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadCommands } from "../commands/registry";
import { BeeCommand } from "../lib/bee-command";
import { applyCommandTable } from "../lib/command-table";

const SKILL_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../skills/using-bee/SKILL.md",
);

const buildProgram = async (): Promise<BeeCommand> => {
  const program = new BeeCommand("bee");
  await program.addCommands(loadCommands());
  return program;
};

const main = async (): Promise<void> => {
  const check = process.argv.includes("--check");
  const program = await buildProgram();
  const current = await readFile(SKILL_PATH, "utf8");
  const next = applyCommandTable(current, program);

  if (current === next) {
    return;
  }

  if (check) {
    process.exitCode = 1;
    process.stderr.write(
      "skills/using-bee/SKILL.md is out of date with the CLI commands.\n" +
        "Run `pnpm --filter @nulab/bee generate:skill` and commit the result.\n",
    );
    return;
  }

  await writeFile(SKILL_PATH, next);
  process.stdout.write("Updated skills/using-bee/SKILL.md\n");
};

await main();
