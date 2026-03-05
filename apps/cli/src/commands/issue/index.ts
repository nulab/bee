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
  },
});
