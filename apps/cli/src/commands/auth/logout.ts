import { UserError } from "@repo/cli-utils";
import { loadConfig, removeSpace } from "@repo/config";
import consola from "consola";
import { BeeCommand } from "../../lib/bee-command";

const logout = new BeeCommand("logout")
  .summary("Remove authentication for a Backlog space")
  .description(
    `Remove authentication for a Backlog space.

The stored credentials are removed locally. This does not revoke API keys or OAuth tokens on the Backlog server.

If only one space is configured, it will be selected automatically. If multiple spaces are configured, you will be prompted to select one.`,
  )
  .option("-s, --space <hostname>", "The hostname of the Backlog space")
  .envVars([["BACKLOG_SPACE", "Space hostname to log out from"]])
  .examples([
    { description: "Select space via prompt", command: "bee auth logout" },
    {
      description: "Log out of a specific space",
      command: "bee auth logout -s xxx.backlog.com",
    },
  ])
  .action(async (opts) => {
    const config = loadConfig();

    let hostname = opts.space || process.env.BACKLOG_SPACE;
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
