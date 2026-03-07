import { dashboardUrl, getClient, openOrPrintUrl } from "@repo/backlog-utils";
import { type Row, formatDate, outputArgs, outputResult, printTable } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../lib/command-usage";
import * as commonArgs from "../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Show a summary of your Backlog activity.

Displays your assigned issues sorted by due date, unread notification count,
and your projects. The layout is modeled after the Backlog web dashboard.

Use \`--web\` to open the Backlog dashboard in your browser instead.`,

  examples: [
    { description: "Show dashboard", command: "bee dashboard" },
    { description: "Open dashboard in browser", command: "bee dashboard --web" },
    { description: "Output as JSON", command: "bee dashboard --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const dashboard = withUsage(
  defineCommand({
    meta: {
      name: "dashboard",
      description: "Show a summary of your Backlog activity",
    },
    args: {
      ...outputArgs,
      web: commonArgs.web("dashboard"),
      "no-browser": commonArgs.noBrowser,
    },
    async run({ args }) {
      const { client, host } = await getClient();

      if (args.web || args["no-browser"]) {
        const url = dashboardUrl(host);
        await openOrPrintUrl(url, Boolean(args["no-browser"]), consola);
        return;
      }

      const [myself, notifications, issues, projects] = await Promise.all([
        client.getMyself(),
        client.getNotificationsCount({ alreadyRead: false, resourceAlreadyRead: false }),
        client.getIssues({
          assigneeId: [-1],
          statusId: [1, 2, 3],
          count: 20,
          sort: "dueDate",
          order: "asc",
        }),
        client.getProjects({ all: false }),
      ]);

      const result = { myself, notifications, issues, projects };

      outputResult(result, args, (data) => {
        consola.log("");
        consola.log(`  ${data.myself.name} (${host})`);

        // Unread notifications
        if (data.notifications.count > 0) {
          consola.log(`  Unread notifications: ${data.notifications.count}`);
        }

        // Assigned issues table
        consola.log("");
        consola.log("  Assigned Issues:");

        if (data.issues.length === 0) {
          consola.log("    No assigned issues.");
        } else {
          const issueRows: Row[] = data.issues.map((issue) => [
            { header: "KEY", value: issue.issueKey },
            { header: "SUMMARY", value: issue.summary },
            { header: "STATUS", value: issue.status?.name ?? "" },
            { header: "PRIORITY", value: issue.priority?.name ?? "" },
            { header: "DUE DATE", value: issue.dueDate ? formatDate(issue.dueDate) : "" },
          ]);
          printTable(issueRows);
        }

        // Projects list
        if (data.projects.length > 0) {
          consola.log("");
          consola.log("  Projects:");
          for (const project of data.projects) {
            consola.log(`    ${project.projectKey.padEnd(20)} ${project.name}`);
          }
        }

        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, dashboard };
