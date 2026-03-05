import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Remove a user from a Backlog project.

The user is specified by their numeric user ID. Use \`bee project users\`
to look up user IDs.

Requires Administrator or Project Administrator role.`,

  examples: [
    {
      description: "Remove a user from a project",
      command: "bee project remove-user -p PROJECT_KEY --user-id 12345",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const removeUser = withUsage(
  defineCommand({
    meta: {
      name: "remove-user",
      description: "Remove a user from a project",
    },
    args: {
      ...outputArgs,
      project: {
        type: "string",
        alias: "p",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
      "user-id": {
        type: "string",
        description: "User ID",
        valueHint: "<number>",
        required: true,
      },
    },
    async run({ args }) {
      const userId = Number(args["user-id"]);
      if (Number.isNaN(userId)) {
        consola.error("User ID must be a number.");
        return process.exit(1);
      }

      const { client } = await getClient();

      const user = await client.deleteProjectUsers(args.project, { userId });

      outputResult(user, args, (data) => {
        consola.success(`Removed user ${data.name} from project ${args.project}.`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, removeUser };
