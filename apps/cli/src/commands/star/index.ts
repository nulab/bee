import { defineCommand } from "citty";

export const star = defineCommand({
  meta: {
    name: "star",
    description: "Manage stars",
  },
  subCommands: {
    add: () => import("./add").then((m) => m.add),
    list: () => import("./list").then((m) => m.list),
    count: () => import("./count").then((m) => m.count),
    remove: () => import("./remove").then((m) => m.remove),
  },
});
