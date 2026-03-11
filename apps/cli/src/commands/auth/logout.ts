import { UserError } from "@repo/cli-utils";
import { loadConfig, removeAllSpaces, removeSpace } from "@repo/config";
import consola from "consola";
import { BeeCommand } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const logout = new BeeCommand("logout")
  .summary("Remove authentication for a Backlog space")
  .description(
    `Removes stored credentials locally. Does not revoke API keys or OAuth tokens on the server.`,
  )
  .addOption(opt.space())
  .option("--all", "Log out of all spaces")
  .examples([
    { description: "Select space via prompt", command: "bee auth logout" },
    {
      description: "Log out of a specific space",
      command: "bee auth logout -s xxx.backlog.com",
    },
    {
      description: "Log out of all spaces",
      command: "bee auth logout --all",
    },
  ])
  .action(async (opts) => {
    if (opts.all && opts.space) {
      throw new UserError("Cannot use --all with --space.");
    }

    const config = loadConfig();

    if (opts.all) {
      if (config.spaces.length === 0) {
        consola.info("No spaces are currently authenticated.");
        return;
      }

      removeAllSpaces();
      consola.success(`Logged out of ${config.spaces.length} space(s).`);
      return;
    }

    let hostname = opts.space;
    if (!hostname) {
      if (config.spaces.length === 0) {
        consola.info("No spaces are currently authenticated.");
        return;
      }

      const [firstSpace] = config.spaces;
      if (config.spaces.length === 1) {
        hostname = firstSpace.host;
      } else if (process.stdin.isTTY) {
        hostname = await consola.prompt("Select a space to log out from:", {
          type: "select",
          options: config.spaces.map((s) => s.host),
        });

        if (typeof hostname !== "string" || !hostname) {
          throw new UserError("No space selected.");
        }
      } else {
        throw new UserError(
          "Hostname is required. Use --space to provide it in non-interactive mode.",
        );
      }
    }

    try {
      removeSpace(hostname);
    } catch {
      throw new UserError(`Space "${hostname}" is not configured.`);
    }

    consola.success(`Logged out of ${hostname}.`);
  });

export default logout;
