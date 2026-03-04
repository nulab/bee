import { defineCommand, runMain } from "citty";
import { showCommandUsage } from "./lib/command-usage";
import pkg from "../package.json" with { type: "json" };

const main = defineCommand({
  meta: {
    name: "bee",
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    auth: () => import("./commands/auth/index").then((m) => m.auth),
  },
});

void runMain(main, { showUsage: showCommandUsage });
