import { defineCommand } from "citty";

export const issue = defineCommand({
  meta: {
    name: "issue",
    description: "Manage Backlog issues",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    status: () => import("./status").then((m) => m.status),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    close: () => import("./close").then((m) => m.close),
    reopen: () => import("./reopen").then((m) => m.reopen),
    comment: () => import("./comment").then((m) => m.comment),
    delete: () => import("./delete").then((m) => m.deleteIssue),
  },
});
