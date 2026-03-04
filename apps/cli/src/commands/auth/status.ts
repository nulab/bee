import { createClient } from "@repo/api";
import { loadConfig } from "@repo/config";
import { defineCommand } from "citty";
import consola from "consola";

type BacklogUser = {
  name: string;
  userId: string;
};

export const status = defineCommand({
  meta: {
    name: "status",
    description: "Show authentication status",
  },
  args: {
    space: {
      type: "string",
      alias: "s",
      description: "Filter by space hostname",
    },
    "show-token": {
      type: "boolean",
      description: "Display the auth token",
    },
  },
  async run({ args }) {
    const config = loadConfig();

    const filterSpace = args.space || process.env.BACKLOG_SPACE;
    const spaces = filterSpace
      ? config.spaces.filter((s) => s.host === filterSpace)
      : config.spaces;

    if (spaces.length === 0) {
      if (filterSpace) {
        consola.info(`No authentication configured for ${filterSpace}.`);
      } else {
        consola.info("No spaces are authenticated. Run `bl auth login` to get started.");
      }
      return;
    }

    for (const space of spaces) {
      const isDefault = config.defaultSpace === space.host;
      const label = isDefault ? `${space.host} (default)` : space.host;

      let user: BacklogUser | null = null;
      try {
        const clientConfig =
          space.auth.method === "api-key"
            ? { host: space.host, apiKey: space.auth.apiKey }
            : { host: space.host, accessToken: space.auth.accessToken };
        const client = createClient(clientConfig);
        user = await client<BacklogUser>("/users/myself");
      } catch (error) {
        consola.debug("Token verification failed:", error);
      }

      consola.log("");
      consola.log(`  ${label}`);
      consola.log(`    Method: ${space.auth.method}`);

      if (user) {
        consola.log(`    User:   ${user.name} (${user.userId})`);
        consola.log("    Status: Authenticated");
      } else {
        consola.log("    Status: Authentication failed");
      }

      if (args["show-token"]) {
        const token = space.auth.method === "api-key" ? space.auth.apiKey : space.auth.accessToken;
        consola.log(`    Token:  ${token}`);
      }
    }

    consola.log("");
  },
});
