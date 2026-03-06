import { defineCommand } from "citty";

export const user = defineCommand({
  meta: {
    name: "user",
    description: "Manage Backlog users",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    me: () => import("./me").then((m) => m.me),
    activities: () => import("./activities").then((m) => m.activities),
  },
});
