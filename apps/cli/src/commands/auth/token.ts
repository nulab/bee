import { findSpace, loadConfig, resolveSpace } from "@repo/config";
import { defineCommand } from "citty";
import consola from "consola";

export const token = defineCommand({
  meta: {
    name: "token",
    description: "Print the auth token to stdout",
  },
  args: {
    space: {
      type: "string",
      alias: "s",
      description: "Space hostname",
    },
  },
  run({ args }) {
    const space = args.space ? findSpace(loadConfig().spaces, args.space) : resolveSpace();

    if (!space) {
      consola.error("No space configured. Run `bl auth login` to authenticate.");
      return process.exit(1);
    }

    const token = space.auth.method === "api-key" ? space.auth.apiKey : space.auth.accessToken;

    process.stdout.write(token);
  },
});
