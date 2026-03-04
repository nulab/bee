import { type BacklogUser } from "@repo/api";
import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "#/utils/client.js";

const removeUser = defineCommand({
  meta: {
    name: "remove-user",
    description: "Remove a user from a project",
  },
  args: {
    "project-key": {
      type: "positional",
      description: "Project key",
      required: true,
    },
    "user-id": {
      type: "string",
      description: "User ID (numeric)",
      required: true,
    },
  },
  async run({ args }) {
    const { client } = await getClient();

    const userId = Number.parseInt(args["user-id"], 10);
    if (Number.isNaN(userId)) {
      consola.error(`Invalid user ID: "${args["user-id"]}"`);
      return process.exit(1);
    }

    const user = await client<BacklogUser>(`/projects/${args["project-key"]}/users`, {
      method: "DELETE",
      body: {
        userId,
      },
    });

    consola.success(`Removed user ${user.name} from project ${args["project-key"]}.`);
  },
});

export { removeUser };
