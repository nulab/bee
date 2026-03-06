import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Update an existing issue type in a Backlog project.

Only the specified fields will be updated. Fields that are not provided
will remain unchanged.`,

  examples: [
    {
      description: "Rename an issue type",
      command: 'bee issue-type edit 12345 -p PROJECT -n "New Name"',
    },
    {
      description: "Change issue type color",
      command: 'bee issue-type edit 12345 -p PROJECT --color "#ff0000"',
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
      description: "Edit an issue type",
    },
    args: {
      ...outputArgs,
      issueType: {
        type: "positional",
        description: "Issue type ID",
        required: true,
        valueHint: "<number>",
      },
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "New name of the issue type",
      },
      color: {
        type: "string",
        description: "Change display color",
        valueHint: "<#hex>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const issueType = await client.patchIssueType(args.project, Number(args.issueType), {
        name: args.name,
        color: args.color as never,
      });

      outputResult(issueType, args, (data) => {
        consola.success(`Updated issue type ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, edit };
