import { defineCommand } from "citty";

export const issueType = defineCommand({
  meta: {
    name: "issue-type",
    description: "Manage project issue types",
  },
  subCommands: {
    list: () => import("./list").then((m) => m.list),
    create: () => import("./create").then((m) => m.create),
    edit: () => import("./edit").then((m) => m.edit),
    delete: () => import("./delete").then((m) => m.deleteIssueType),
  },
});
