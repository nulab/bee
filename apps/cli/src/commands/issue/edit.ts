import { PRIORITY_NAMES, PriorityId, getClient, resolveUserId } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const edit = new BeeCommand("edit")
  .summary("Edit an issue")
  .description(
    `Update an existing Backlog issue.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .option("-t, --title <text>", "New title of the issue")
  .option("-d, --description <text>", "New description of the issue")
  .option("-S, --status <id>", "New status ID")
  .option("-P, --priority <name>", `Change priority`)
  .option("-T, --type <id>", "New issue type ID")
  .option("--assignee <id>", "New assignee user ID. Use @me for yourself.")
  .option("--resolution <id>", "Resolution ID")
  .option("--parent-issue <id>", "New parent issue ID")
  .option("--start-date <date>", "New start date")
  .option("--due-date <date>", "New due date")
  .option("--estimated-hours <n>", "New estimated hours")
  .option("--actual-hours <n>", "New actual hours")
  .addOption(opt.comment())
  .addOption(opt.notify())
  .addOption(opt.attachment())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Update issue title",
      command: 'bee issue edit PROJECT-123 -t "New title"',
    },
    {
      description: "Change assignee and priority",
      command: "bee issue edit PROJECT-123 --assignee 12345 --priority high",
    },
    {
      description: "Add a comment with the update",
      command: 'bee issue edit PROJECT-123 -t "New title" --comment "Updated title"',
    },
  ])
  .action(async (issue, opts) => {
    const { client } = await getClient(opts.space);

    const notifiedUserId = opts.notify ?? [];
    const attachmentId = opts.attachment ?? [];

    let priorityId: number | undefined;
    if (opts.priority) {
      priorityId = PriorityId[opts.priority.toLowerCase()];
      if (priorityId === undefined) {
        throw new Error(
          `Unknown priority "${opts.priority}". Valid values: ${PRIORITY_NAMES.join(", ")}`,
        );
      }
    }

    const issueData = await client.patchIssue(issue, {
      summary: opts.title,
      description: opts.description,
      statusId: opts.status ? Number(opts.status) : undefined,
      priorityId,
      issueTypeId: opts.type ? Number(opts.type) : undefined,
      assigneeId: opts.assignee ? await resolveUserId(client, opts.assignee) : undefined,
      resolutionId: opts.resolution ? Number(opts.resolution) : undefined,
      parentIssueId: opts.parentIssue ? Number(opts.parentIssue) : undefined,
      startDate: opts.startDate,
      dueDate: opts.dueDate,
      estimatedHours: opts.estimatedHours ? Number(opts.estimatedHours) : undefined,
      actualHours: opts.actualHours ? Number(opts.actualHours) : undefined,
      comment: opts.comment,
      notifiedUserId,
      attachmentId,
    });

    outputResult(issueData, opts as { json?: string }, (data) => {
      consola.success(`Updated issue ${data.issueKey}: ${data.summary}`);
    });
  });

export default edit;
