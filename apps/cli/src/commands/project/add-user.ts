import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Add a user to a Backlog project.

The user is specified by their numeric user ID. Use "bee project users"
to look up user IDs for a project.

Requires Administrator or Project Administrator role.`,

  examples: [
    {
      description: "Add a user to a project",
      command: "bee project add-user -p PROJECT_KEY --user-id 12345",
    },
  ],

  annotations: {
    environment: [["BACKLOG_PROJECT", "Default project ID or project key"]],
  },
};

const addUser = withUsage(
  defineCommand({
    meta: {
      name: "add-user",
      description: "Add a user to a project",
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

      const user = await client.postProjectUser(args.project, String(userId));

      outputResult(user, args, (data) => {
        consola.success(`Added user ${data.name} to project ${args.project}.`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, addUser };
