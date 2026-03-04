import { type BacklogUser } from "@repo/api";
import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "#/utils/client.js";
import { padEnd } from "#/utils/format.js";
import { outputArgs, outputResult } from "#/utils/output.js";

const users = defineCommand({
  meta: {
    name: "users",
    description: "List project users",
  },
  args: {
    ...outputArgs,
    "project-key": {
      type: "positional",
      description: "Project key",
      required: true,
    },
  },
  async run({ args }) {
    const { client } = await getClient();

    const userList = await client<BacklogUser[]>(`/projects/${args["project-key"]}/users`);

    outputResult(userList, args, (data) => {
      if (data.length === 0) {
        consola.info("No users found.");
        return;
      }

      const roleNames: Record<number, string> = {
        1: "Administrator",
        2: "Normal User",
        3: "Reporter",
        4: "Viewer",
        5: "Guest Reporter",
        6: "Guest Viewer",
      };

      const header = `${padEnd("ID", 10)}${padEnd("USER ID", 20)}${padEnd("NAME", 20)}ROLE`;
      consola.log(header);

      for (const user of data) {
        const id = padEnd(`${user.id}`, 10);
        const userId = padEnd(user.userId, 20);
        const name = padEnd(user.name, 20);
        const role = roleNames[user.roleType] ?? `Role ${user.roleType}`;
        consola.log(`${id}${userId}${name}${role}`);
      }
    });
  },
});

export { users };
