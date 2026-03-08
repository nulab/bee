import { UserError } from "@repo/cli-utils";
import { loadConfig, writeConfig } from "@repo/config";
import consola from "consola";
import { BeeCommand } from "../../lib/bee-command";

const switchSpace = new BeeCommand("switch")
  .summary("Switch active space")
  .description(
    `Switch the active (default) Backlog space.

Changes which space is used by default when running commands without
\`--space\`.

If multiple spaces are configured, you will be prompted to select one
interactively. Use \`--space\` to switch directly without a prompt.

For a list of configured spaces, see \`bee auth status\`.`,
  )
  .option("-s, --space <hostname>", "The hostname of the Backlog space")
  .envVars([["BACKLOG_SPACE", "Space hostname to switch to"]])
  .examples([
    { description: "Select space via prompt", command: "bee auth switch" },
    {
      description: "Switch to a specific space",
      command: "bee auth switch -s xxx.backlog.com",
    },
  ])
  .action(async (opts) => {
    const config = loadConfig();

    let hostname = opts.space || process.env.BACKLOG_SPACE;

    if (!hostname) {
      if (config.spaces.length === 0) {
        throw new UserError("No spaces configured. Run `bee auth login` to add a space.");
      }

      if (!process.stdin.isTTY) {
        throw new UserError(
          "Hostname is required. Use --space to provide it in non-interactive mode.",
        );
      }

      const hosts = config.spaces.map((s) => s.host);
      hostname = await consola.prompt("Select space:", {
        type: "select",
        options: hosts,
      });

      if (typeof hostname !== "string" || !hostname) {
        throw new UserError("No space selected.");
      }
    }

    const space = config.spaces.find((s) => s.host === hostname);

    if (!space) {
      throw new UserError(
        `Space "${hostname}" not found. Available spaces: ${config.spaces.map((s) => s.host).join(", ")}`,
      );
    }

    writeConfig({ ...config, defaultSpace: hostname });

    consola.success(`Switched active space to ${hostname}.`);
  });

export default switchSpace;
