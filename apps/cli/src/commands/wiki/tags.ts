import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `List wiki tags in a Backlog project.

Tags are labels attached to wiki pages for organization.`,

  examples: [
    { description: "List wiki tags", command: "bee wiki tags -p PROJECT" },
    { description: "Output as JSON", command: "bee wiki tags -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const tags = withUsage(
  defineCommand({
    meta: {
      name: "tags",
      description: "List wiki tags",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const result = await client.getWikisTags(args.project);

      outputResult(result, args, (data) => {
        if (data.length === 0) {
          consola.info("No wiki tags found.");
          return;
        }

        for (const tag of data) {
          consola.log(tag.name);
        }
      });
    },
  }),
  commandUsage,
);

export { commandUsage, tags };
