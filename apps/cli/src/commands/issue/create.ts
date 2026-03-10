import {
  PRIORITY_NAMES,
  PriorityId,
  getClient,
  issueUrl,
  resolveProjectIds,
  resolveUserId,
} from "@repo/backlog-utils";
import { outputResult, promptRequired, vFiniteNumber, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { Option } from "commander";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const create = new BeeCommand("create")
  .summary("Create an issue")
  .description(
    `Omitted required fields will be prompted interactively. Priority accepts a name: \`high\`, \`normal\`, or \`low\`.`,
  )
  .addOption(new Option("-p, --project <id>", "Project ID or project key").env("BACKLOG_PROJECT"))
  .option("-t, --title <text>", "Issue title")
  .option("-T, --type <id>", "Issue type ID")
  .option("-P, --priority <name>", "Priority")
  .option("-d, --description <text>", "Issue description")
  .addOption(opt.assignee())
  .addOption(opt.category())
  .addOption(opt.version())
  .addOption(opt.milestone())
  .option("--parent-issue <id>", "Parent issue ID")
  .option("--start-date <date>", "Start date")
  .option("--due-date <date>", "Due date")
  .option("--estimated-hours <n>", "Estimated hours")
  .option("--actual-hours <n>", "Actual hours")
  .addOption(opt.notify())
  .addOption(opt.attachment())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    {
      description: "Create an issue with required fields",
      command: 'bee issue create -p PROJECT --type 1 --priority normal -t "Fix login bug"',
    },
    {
      description: "Create an issue with description",
      command:
        'bee issue create -p PROJECT --type 1 --priority normal -t "Title" -d "Details here"',
    },
    {
      description: "Create an issue assigned to yourself",
      command: 'bee issue create -p PROJECT --type 1 --priority high -t "Title" --assignee @me',
    },
    {
      description: "Output as JSON",
      command: 'bee issue create -p PROJECT --type 1 --priority normal -t "Title" --json',
    },
  ])
  .action(async (opts) => {
    const { client, host } = await getClient(opts.space);

    const project = await promptRequired("Project:", opts.project);
    const title = await promptRequired("Summary:", opts.title);
    const issueTypeId = await promptRequired("Issue type ID:", opts.type);
    const priority = await promptRequired("Priority:", opts.priority, {
      valueHint: `{${PRIORITY_NAMES.join("|")}}`,
    });
    const priorityId = PriorityId[priority.toLowerCase()];
    if (priorityId === undefined) {
      throw new Error(`Unknown priority "${priority}". Valid values: ${PRIORITY_NAMES.join(", ")}`);
    }

    const [projectId] = await resolveProjectIds(client, [project]);
    const assigneeId = opts.assignee ? await resolveUserId(client, opts.assignee) : undefined;
    const categoryId = opts.category ?? [];
    const versionId = opts.version ?? [];
    const milestoneId = opts.milestone ?? [];
    const notifiedUserId = opts.notify ?? [];
    const attachmentId = opts.attachment ?? [];

    const issue = await client.postIssue({
      projectId,
      summary: title,
      issueTypeId: v.parse(vInteger, issueTypeId),
      priorityId,
      description: opts.description,
      assigneeId,
      categoryId,
      versionId,
      milestoneId,
      parentIssueId: v.parse(v.optional(vInteger), opts.parentIssue),
      startDate: opts.startDate,
      dueDate: opts.dueDate,
      estimatedHours: v.parse(v.optional(vFiniteNumber), opts.estimatedHours),
      actualHours: v.parse(v.optional(vFiniteNumber), opts.actualHours),
      notifiedUserId,
      attachmentId,
    });

    outputResult(issue, opts as { json?: string }, (data) => {
      consola.success(`Created issue ${data.issueKey}: ${data.summary}`);
      consola.info(issueUrl(host, data.issueKey));
    });
  });

export default create;
