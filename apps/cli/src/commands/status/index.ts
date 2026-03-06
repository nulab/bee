import { defineCommand } from "citty";

export const status = defineCommand({
  meta: {
    name: "status",
    description: "Manage project statuses",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    delete: () => import("./delete").then((m) => m.deleteStatus),
  },
});
