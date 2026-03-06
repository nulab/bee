import { defineCommand } from "citty";

export const team = defineCommand({
  meta: {
    name: "team",
    description: "Manage Backlog teams",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    delete: () => import("./delete").then((m) => m.deleteTeam),
  },
});
