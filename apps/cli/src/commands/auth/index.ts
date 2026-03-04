import { defineCommand } from "citty";

export const auth = defineCommand({
  meta: {
    name: "auth",
    description: "Authenticate bee with Backlog",
  },
  subCommands: {
    login: () => import("./login.js").then((m) => m.login),
    logout: () => import("./logout.js").then((m) => m.logout),
    status: () => import("./status.js").then((m) => m.status),
    token: () => import("./token.js").then((m) => m.token),
    refresh: () => import("./refresh.js").then((m) => m.refresh),
    switch: () => import("./switch.js").then((m) => m.switchSpace),
  },
});
