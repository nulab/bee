import { defineCommand } from "citty";

export const notification = defineCommand({
  meta: {
    name: "notification",
    description: "Manage Backlog notifications",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    count: () => import("./count").then((m) => m.count),
    read: () => import("./read").then((m) => m.read),
    "read-all": () => import("./read-all").then((m) => m.readAll),
  },
});
