import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult, promptRequired } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Create a new milestone in a Backlog project.

If \`--name\` is not provided, you will be prompted interactively.
Use \`--start-date\` and \`--release-due-date\` to set the milestone schedule.`,

  examples: [
    { description: "Create a milestone", command: 'bee milestone create -p PROJECT -n "v1.0.0"' },
    {
      description: "Create with dates",
      command:
        'bee milestone create -p PROJECT -n "v1.0.0" --start-date 2026-04-01 --release-due-date 2026-06-30',
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
      description: "Create a milestone",
    },
    args: {
      ...outputArgs,
      project: { ...commonArgs.project, required: true },
      name: {
        type: "string",
        alias: "n",
        description: "Milestone name",
      },
      description: {
        type: "string",
        alias: "d",
        description: "Milestone description",
      },
      "start-date": {
        type: "string",
        description: "Start date",
        valueHint: "<yyyy-MM-dd>",
      },
      "release-due-date": {
        type: "string",
        description: "Release due date",
        valueHint: "<yyyy-MM-dd>",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const name = await promptRequired("Milestone name:", args.name);

      const milestone = await client.postVersions(args.project, {
        name,
        description: args.description,
        startDate: args["start-date"],
        releaseDueDate: args["release-due-date"],
      });

      outputResult(milestone, args, (data) => {
        consola.success(`Created milestone ${data.name} (ID: ${data.id})`);
      });
    },
  }),
  commandUsage,
);

export { commandUsage, create };
