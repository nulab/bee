import { defineCommand } from "citty";

export const project = defineCommand({
  meta: {
    name: "project",
    description: "Manage Backlog projects",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    users: () => import("./users").then((m) => m.users),
    activities: () => import("./activities").then((m) => m.activities),
  },
});
