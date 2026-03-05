import { defineCommand } from "citty";

export const project = defineCommand({
  meta: {
    name: "project",
    description: "Manage Backlog projects",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    delete: () => import("./delete").then((m) => m.deleteProject),
    users: () => import("./users").then((m) => m.users),
    activities: () => import("./activities").then((m) => m.activities),
    "add-user": () => import("./add-user").then((m) => m.addUser),
    "remove-user": () => import("./remove-user").then((m) => m.removeUser),
  },
});
