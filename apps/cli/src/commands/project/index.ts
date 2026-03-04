import { defineCommand } from "citty";

const project = defineCommand({
  meta: {
    name: "project",
    description: "Manage projects",
  },
  subCommands: {
    list: () => import("./list.js").then((m) => m.list),
    view: () => import("./view.js").then((m) => m.view),
    create: () => import("./create.js").then((m) => m.create),
    edit: () => import("./edit.js").then((m) => m.edit),
    delete: () => import("./delete.js").then((m) => m.deleteProject),
    users: () => import("./users.js").then((m) => m.users),
    activities: () => import("./activities.js").then((m) => m.activities),
    "add-user": () => import("./add-user.js").then((m) => m.addUser),
    "remove-user": () => import("./remove-user.js").then((m) => m.removeUser),
  },
});

export { project };
