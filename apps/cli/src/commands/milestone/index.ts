import { defineCommand } from "citty";

export const milestone = defineCommand({
  meta: {
    name: "milestone",
    description: "Manage project milestones",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    delete: () => import("./delete").then((m) => m.deleteMilestone),
  },
});
