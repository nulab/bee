import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, splitArg } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import * as v from "valibot";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";
import { IssueStatusId, RESOLUTION_NAMES, ResolutionId } from "../../lib/issue-constants";

const commandUsage: CommandUsage = {
  long: `Close a Backlog issue by setting its status to \`Closed\`.

By default the resolution is set to \`Fixed\`. Use \`--resolution\` to
specify a different resolution.

Optionally add a comment with \`--comment\`.`,

  examples: [
    { description: "Close an issue", command: "bee issue close PROJECT-123" },
    {
      description: "Close with a comment",
      command: 'bee issue close PROJECT-123 -c "Done"',
    },
    {
      description: "Close as duplicate",
      command: "bee issue close PROJECT-123 --resolution duplicate",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const close = withUsage(
  defineCommand({
    meta: {
      name: "close",
      description: "Close an issue",
    },
    args: {
      ...outputArgs,
      issue: {
        type: "positional",
        description: "Issue ID or issue key",
        valueHint: "<PROJECT-123>",
        required: true,
      },
      comment: {
        type: "string",
        alias: "c",
        description: "Comment to add when closing",
      },
      resolution: {
        type: "string",
        description: "Resolution (default: fixed)",
        valueHint: `{${RESOLUTION_NAMES.join("|")}}`,
      },
      notify: {
        type: "string",
        description: "User IDs to notify (comma-separated for multiple)",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const resolutionId = args.resolution
        ? (ResolutionId[args.resolution] ?? Number(args.resolution))
        : ResolutionId.fixed;

      const notifiedUserId = splitArg(args.notify, v.number());

      const issue = await client.patchIssue(args.issue, {
        statusId: IssueStatusId.Closed,
        resolutionId,
        comment: args.comment,
        notifiedUserId,
      });

      outputResult(issue, args, (data) => {
        consola.success(`Closed issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, close };
