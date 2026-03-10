import { PRIORITY_NAMES, PriorityId, getClient, resolveUserId } from "@repo/backlog-utils";
import { outputResult, parseArg, vFiniteNumber, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const edit = new BeeCommand("edit")
  .summary("Edit an issue")
  .description(`Only specified fields are updated; others remain unchanged.`)
  .argument("<issue>", "Issue ID or issue key")
  .option("-t, --title <text>", "New title of the issue")
  .option("-d, --description <text>", "New description of the issue")
  .option("-S, --status <id>", "New status ID")
  .option("-P, --priority <name>", `Change priority`)
  .option("-T, --type <id>", "New issue type ID")
  .option("--assignee <id>", "New assignee user ID. Use @me for yourself.")
  .addOption(opt.category())
  .addOption(opt.version())
  .addOption(opt.milestone())
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

    const categoryId = opts.category ?? [];
    const versionId = opts.version ?? [];
    const milestoneId = opts.milestone ?? [];
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
      statusId: parseArg(v.optional(vInteger), opts.status, "--status"),
      priorityId,
      issueTypeId: parseArg(v.optional(vInteger), opts.type, "--type"),
      assigneeId: opts.assignee ? await resolveUserId(client, opts.assignee) : undefined,
      categoryId,
      versionId,
      milestoneId,
      resolutionId: parseArg(v.optional(vInteger), opts.resolution, "--resolution"),
      parentIssueId: parseArg(v.optional(vInteger), opts.parentIssue, "--parent-issue"),
      startDate: opts.startDate,
      dueDate: opts.dueDate,
      estimatedHours: parseArg(v.optional(vFiniteNumber), opts.estimatedHours, "--estimated-hours"),
      actualHours: parseArg(v.optional(vFiniteNumber), opts.actualHours, "--actual-hours"),
      comment: opts.comment,
      notifiedUserId,
      attachmentId,
    });

    outputResult(issueData, opts as { json?: string }, (data) => {
      consola.success(`Updated issue ${data.issueKey}: ${data.summary}`);
    });
  });

export default edit;
