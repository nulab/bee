import consola from "consola";
import { installHttpDispatcher } from "@repo/backlog-utils";
import { loadCommands } from "./commands/registry";
import { BeeCommand } from "./lib/bee-command";
import { handleError } from "./lib/error";
import pkg from "../package.json" with { type: "json" };

consola.options.formatOptions.date = false;
installHttpDispatcher();

const program = new BeeCommand("bee").version(pkg.version).description(pkg.description ?? "");

await program.addCommands(loadCommands());

program.exitOverride();

try {
  await program.parseAsync();
} catch (error) {
  handleError(error);
}
