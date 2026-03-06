import { defineCommand } from "citty";

export const wiki = defineCommand({
  meta: {
    name: "wiki",
    description: "Manage Backlog wiki pages",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    count: () => import("./count").then((m) => m.count),
    tags: () => import("./tags").then((m) => m.tags),
    history: () => import("./history").then((m) => m.history),
    attachments: () => import("./attachments").then((m) => m.attachments),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    delete: () => import("./delete").then((m) => m.deleteWiki),
  },
});
