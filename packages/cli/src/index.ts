import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };

const main = defineCommand({
  meta: {
    name: "bl",
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    // Commands will be registered here
  },
});

runMain(main);
