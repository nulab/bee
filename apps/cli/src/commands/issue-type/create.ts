import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Create a new issue type in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.
The \`--color\` flag must be one of the predefined Backlog colors.`,

  examples: [
    {
      description: "Create an issue type",
      command: 'bee issue-type create -p PROJECT -n "Enhancement" --color "#2779ca"',
    },
    {
      description: "Create interactively",
      command: 'bee issue-type create -p PROJECT --color "#2779ca"',
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const create = withUsage(
  defineCommand({
    meta: {
      name: "create",
      description: "Create an issue type",
    },
    args: {
      ...outputArgs,
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "Issue type name",
      },
      color: {
        type: "string",
        description: "Display color",
        valueHint:
          "{#e30000|#990000|#934981|#814fbc|#2779ca|#007e9a|#7ea800|#ff9200|#ff3265|#666665}",
        required: true,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const name = await promptRequired("Issue type name:", args.name);

      const issueType = await client.postIssueType(args.project, {
        name,
        color: args.color as never,
      });

      outputResult(issueType, args, (data) => {
        consola.success(`Created issue type ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
