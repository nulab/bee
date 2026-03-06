import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";
import * as commonArgs from "../../lib/common-args";

const commandUsage: CommandUsage = {
  long: `Display the number of wiki pages in a Backlog project.

The count includes all wiki pages regardless of tag or keyword.`,

  examples: [
    { description: "Count wiki pages", command: "bee wiki count -p PROJECT" },
    { description: "Output as JSON", command: "bee wiki count -p PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

const count = withUsage(
  defineCommand({
    meta: {
      name: "count",
      description: "Count wiki pages",
    },
    args: {
      ...outputArgs,
      project: commonArgs.projectPositional,
    },
    async run({ args }) {
      const { client } = await getClient();

      const result = await client.getWikisCount(args.project);

      outputResult(result, args, (data) => {
        consola.log(String(data.count));
      });
    },
  }),
  commandUsage,
);

export { commandUsage, count };
