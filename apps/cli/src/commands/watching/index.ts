import { defineCommand } from "citty";

export const watching = defineCommand({
  meta: {
    name: "watching",
    description: "Manage watching (issue subscriptions)",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    add: () => import("./add").then((m) => m.add),
    view: () => import("./view").then((m) => m.view),
    delete: () => import("./delete").then((m) => m.deleteWatching),
    read: () => import("./read").then((m) => m.read),
  },
});
