import consola from "consola";
import { installHttpDispatcher } from "@repo/backlog-utils";
import { loadCommands } from "./commands/registry";
import { BeeCommand } from "./lib/bee-command";
import { handleError } from "./lib/error";
import pkg from "../package.json" with { type: "json" };

consola.options.formatOptions.date = false;
installHttpDispatcher();

const program = new BeeCommand("bee").version(pkg.version).description(pkg.description ?? "");

program.exitOverride();

// Kept out of module scope: unbuild bundles the lazily imported command chunks
// alongside this entry, and those chunks import shared values back from it. A
// top-level `await` here would leave the entry mid-evaluation while they wait
// on it, deadlocking the cycle -- Node reports `unsettled top-level await` and
// exits 13 without running anything.
const main = async (): Promise<void> => {
  try {
    await program.addCommands(loadCommands());
    await program.parseAsync();
  } catch (error) {
    handleError(error);
  }
};

void main();
