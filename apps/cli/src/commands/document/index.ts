import { defineCommand } from "citty";

export const document = defineCommand({
  meta: {
    name: "document",
    description: "Manage Backlog documents",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    tree: () => import("./tree").then((m) => m.tree),
    attachments: () => import("./attachments").then((m) => m.attachments),
    create: () => import("./create").then((m) => m.create),
    delete: () => import("./delete").then((m) => m.deleteDocument),
  },
});
