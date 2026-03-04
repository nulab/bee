import { defineCommand, runMain } from "citty";
import { showCommandUsage } from "#src/lib/command-usage.js";
import pkg from "../package.json" with { type: "json" };

const main = defineCommand({
  meta: {
    name: "bl",
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    auth: () => import("#src/commands/auth/index.js").then((m) => m.auth),
  },
});

void runMain(main, { showUsage: showCommandUsage });
