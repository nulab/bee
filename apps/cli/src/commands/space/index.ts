import { defineCommand } from "citty";

export const space = defineCommand({
  meta: {
    name: "space",
    description: "Manage space information",
  },
  subCommands: {
    info: () => import("./info").then((m) => m.info),
    activities: () => import("./activities").then((m) => m.activities),
    "disk-usage": () => import("./disk-usage").then((m) => m.diskUsage),
    notification: () => import("./notification").then((m) => m.notification),
  },
});
