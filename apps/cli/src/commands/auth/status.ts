import { type RcAuth, loadConfig } from "@repo/config";
import { type Entity, Backlog } from "backlog-js";
import consola from "consola";
import { printDefinitionList } from "@repo/cli-utils";
import { BeeCommand } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const getToken = (auth: RcAuth): string =>
  auth.method === "api-key" ? auth.apiKey : auth.accessToken;

const status = new BeeCommand("status")
  .summary("Show authentication status")
  .description(
    `Verifies credential validity for each configured space via the Backlog API. The active (default) space is indicated.`,
  )
  .addOption(opt.space())
  .option("--show-token", "Display the auth token")
  .examples([
    { description: "Display status for all spaces", command: "bee auth status" },
    {
      description: "Check a specific space",
      command: "bee auth status -s xxx.backlog.com",
    },
    { description: "Show auth tokens in the output", command: "bee auth status --show-token" },
  ])
  .action(async (opts) => {
    const config = loadConfig();

    const filterSpace = opts.space;
    const spaces = filterSpace
      ? config.spaces.filter((s) => s.host === filterSpace)
      : config.spaces;

    if (spaces.length === 0) {
      if (filterSpace) {
        consola.info(`No authentication configured for ${filterSpace}.`);
      } else {
        consola.info("No spaces are authenticated. Run `bee auth login` to get started.");
      }
      return;
    }

    for (const space of spaces) {
      const isDefault = config.defaultSpace === space.host;
      const label = isDefault ? `${space.host} (default)` : space.host;

      let user: Entity.User.User | null = null;
      try {
        const client =
          space.auth.method === "api-key"
            ? new Backlog({ host: space.host, apiKey: space.auth.apiKey })
            : new Backlog({ host: space.host, accessToken: space.auth.accessToken });
        user = await client.getMyself();
      } catch (error) {
        consola.debug("Token verification failed:", error);
      }

      consola.log("");
      consola.log(`  ${label}`);
      printDefinitionList([
        ["Method", space.auth.method],
        ["User", user ? `${user.name} (${user.userId})` : undefined],
        ["Status", user ? "Authenticated" : "Authentication failed"],
        ["Token", opts.showToken ? getToken(space.auth) : undefined],
      ]);
    }

    consola.log("");
  });

export default status;
