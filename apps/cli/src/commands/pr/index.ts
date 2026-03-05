import { defineCommand } from "citty";

export const pr = defineCommand({
  meta: {
    name: "pr",
    description: "Manage Backlog pull requests",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    comments: () => import("./comments").then((m) => m.comments),
    status: () => import("./status").then((m) => m.status),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    close: () => import("./close").then((m) => m.close),
    merge: () => import("./merge").then((m) => m.merge),
    reopen: () => import("./reopen").then((m) => m.reopen),
    comment: () => import("./comment").then((m) => m.comment),
  },
});
