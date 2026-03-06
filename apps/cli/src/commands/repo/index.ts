import { defineCommand } from "citty";

export const repo = defineCommand({
  meta: {
    name: "repo",
    description: "Manage Backlog Git repositories",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    view: () => import("./view").then((m) => m.view),
    clone: () => import("./clone").then((m) => m.clone),
  },
});
