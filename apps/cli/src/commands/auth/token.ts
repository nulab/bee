import { UserError } from "@repo/cli-utils";
import { findSpace, loadConfig, resolveSpace } from "@repo/config";
import { BeeCommand } from "../../lib/bee-command";

const tokenCommand = new BeeCommand("token")
  .summary("Print the auth token to stdout")
  .description(
    `Print the auth token for a Backlog space to standard output.

Without \`--space\`, the default space is used.

The token output can be used with \`BACKLOG_API_KEY\` or piped to other commands.`,
  )
  .option("-s, --space <hostname>", "The hostname of the Backlog space")
  .envVars([["BACKLOG_SPACE", "Default space hostname"]])
  .examples([
    { description: "Print token for default space", command: "bee auth token" },
    {
      description: "Print token for specific space",
      command: "bee auth token -s xxx.backlog.com",
    },
    {
      description: "Use token in a script",
      command:
        'TOKEN=$(bee auth token) && curl -H "X-Api-Key: $TOKEN" https://xxx.backlog.com/api/v2/users/myself',
    },
  ])
  .action((opts) => {
    const space = opts.space ? findSpace(loadConfig().spaces, opts.space) : resolveSpace();

    if (!space) {
      throw new UserError("No space configured. Run `bee auth login` to authenticate.");
    }

    const token = space.auth.method === "api-key" ? space.auth.apiKey : space.auth.accessToken;

    process.stdout.write(token);
  });

export default tokenCommand;
