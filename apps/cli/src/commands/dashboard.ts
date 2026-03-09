import { dashboardUrl, getClient, openOrPrintUrl } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../lib/bee-command";
import * as opt from "../lib/common-options";

const dashboard = new BeeCommand("dashboard")
  .summary("Show a summary of your Backlog activity")
  .description(
    `Show a summary of your Backlog activity.

Displays your assigned issues sorted by due date, unread notification count,
and your projects. The layout is modeled after the Backlog web dashboard.

Use \`--web\` to open the Backlog dashboard in your browser instead.`,
  )
  .addOption(opt.json())
  .addOption(opt.web("dashboard"))
  .addOption(opt.noBrowser())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Show dashboard", command: "bee dashboard" },
    { description: "Open dashboard in browser", command: "bee dashboard --web" },
    { description: "Output as JSON", command: "bee dashboard --json" },
  ])
  .action(async (opts) => {
    const { client, host } = await getClient(opts.space);

    if (opts.web || opts.browser === false) {
      const url = dashboardUrl(host);
      await openOrPrintUrl(url, opts.browser === false, consola);
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

    // commander gives `true` for bare --json, a string for --json fields
    const jsonVal = opts.json === true ? "" : opts.json;
    outputResult(result, { json: jsonVal }, (data) => {
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
  });

export default dashboard;
