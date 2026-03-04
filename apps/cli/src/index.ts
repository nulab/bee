import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };

const main = defineCommand({
  meta: {
    name: "bl",
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    auth: () => import("#/commands/auth/index.js").then((m) => m.auth),
  },
});

void runMain(main);
