import { defineCommand } from "citty";

export const category = defineCommand({
  meta: {
    name: "category",
    description: "Manage project categories",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    delete: () => import("./delete").then((m) => m.deleteCategory),
  },
});
