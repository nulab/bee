import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const CLOSED_STATUS_ID = 4;
const RESOLUTION_FIXED_ID = 0;

const commandUsage: CommandUsage = {
  long: `Close a Backlog issue by setting its status to "Closed".

By default the resolution is set to "Fixed" (ID 0). Use --resolution to
specify a different resolution ID.

Optionally add a comment with the --comment flag.`,

  examples: [
    { description: "Close an issue", command: "bee issue close PROJECT-123" },
    {
      description: "Close with a comment",
      command: 'bee issue close PROJECT-123 -c "Done"',
    },
    {
      description: "Close with a specific resolution",
      command: "bee issue close PROJECT-123 --resolution 1",
    },
  ],
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
        description: "Issue ID or issue key. e.g., PROJECT-123",
        required: true,
      },
      comment: {
        type: "string",
        alias: "c",
        description: "Comment to add when closing",
      },
      resolution: {
        type: "string",
        description: "Resolution ID (default: 0 for Fixed)",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const issue = await client.patchIssue(args.issue, {
        statusId: CLOSED_STATUS_ID,
        resolutionId: args.resolution ? Number(args.resolution) : RESOLUTION_FIXED_ID,
        comment: args.comment,
      });

      outputResult(issue, args, (data) => {
        consola.success(`Closed issue ${data.issueKey}: ${data.summary}`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, close };
