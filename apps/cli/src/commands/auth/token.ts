import { UserError } from "@repo/cli-utils";
import { findSpace, loadConfig, resolveSpace } from "@repo/config";
import { defineCommand } from "citty";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Print the auth token for a Backlog space to standard output.

Without \`--space\`, the default space is used.

The token output can be used with \`BACKLOG_API_KEY\` or piped to other commands.`,

  examples: [
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
  ],

  annotations: {
    environment: [["BACKLOG_SPACE", "Default space hostname"]],
  },
};

const tokenCommand = withUsage(
  defineCommand({
    meta: {
      name: "token",
      description: "Print the auth token to stdout",
    },
    args: {
      space: {
        type: "string",
        alias: "s",
        description: "The hostname of the Backlog space",
        valueHint: "<xxx.backlog.com>",
      },
    },
    run({ args }) {
      const space = args.space ? findSpace(loadConfig().spaces, args.space) : resolveSpace();

      if (!space) {
        throw new UserError("No space configured. Run `bee auth login` to authenticate.");
      }

      const token = space.auth.method === "api-key" ? space.auth.apiKey : space.auth.accessToken;

      process.stdout.write(token);
    },
  }),
  commandUsage,
);

export { commandUsage, tokenCommand as token };
