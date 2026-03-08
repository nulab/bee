import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Update an existing milestone in a Backlog project.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged. Use \`--archived\` to archive or \`--no-archived\` to
unarchive a milestone.`,

  examples: [
    {
      description: "Rename a milestone",
      command: 'bee milestone edit 12345 -p PROJECT -n "v2.0.0"',
    },
    {
      description: "Archive a milestone",
      command: "bee milestone edit 12345 -p PROJECT --archived",
    },
    {
      description: "Update release date",
      command: "bee milestone edit 12345 -p PROJECT --release-due-date 2026-12-31",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const edit = withUsage(
  defineCommand({
    meta: {
      name: "edit",
      description: "Edit a milestone",
    },
    args: {
      ...outputArgs,
      milestone: {
        type: "positional",
        description: "Milestone ID",
        required: true,
        valueHint: "<number>",
      },
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "New name of the milestone",
        required: true,
      },
      description: {
        type: "string",
        alias: "d",
        description: "New description of the milestone",
      },
      "start-date": {
        type: "string",
        description: "New start date",
        valueHint: "<yyyy-MM-dd>",
      },
      "release-due-date": {
        type: "string",
        description: "New release due date",
        valueHint: "<yyyy-MM-dd>",
      },
      archived: {
        type: "boolean",
        description: "Change whether the milestone is archived",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const milestone = await client.patchVersions(args.project, Number(args.milestone), {
        name: args.name,
        description: args.description,
        startDate: args["start-date"],
        releaseDueDate: args["release-due-date"],
        archived: args.archived,
      });

      outputResult(milestone, args, (data) => {
        consola.success(`Updated milestone ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
