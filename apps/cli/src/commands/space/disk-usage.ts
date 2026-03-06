import { getClient } from "@repo/backlog-utils";
import { formatSize, outputArgs, outputResult, printDefinitionList } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display disk usage of the Backlog space.

Shows the total capacity and a breakdown of disk usage by category:
issues, wikis, files, Subversion, Git, and Git LFS.`,

  examples: [
    { description: "View disk usage", command: "bee space disk-usage" },
    { description: "Output as JSON", command: "bee space disk-usage --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH],
  },
};

const diskUsage = withUsage(
  defineCommand({
    meta: {
      name: "disk-usage",
      description: "Display space disk usage",
    },
    args: {
      ...outputArgs,
    },
    async run({ args }) {
      const { client } = await getClient();

      const usage = await client.getSpaceDiskUsage();

      outputResult(usage, args, (data) => {
        consola.log("");
        printDefinitionList([
          ["Capacity", formatSize(data.capacity)],
          ["Issue", formatSize(data.issue)],
          ["Wiki", formatSize(data.wiki)],
          ["File", formatSize(data.file)],
          ["Subversion", formatSize(data.subversion)],
          ["Git", formatSize(data.git)],
          ["Git LFS", formatSize(data.gitLFS)],
        ]);
        consola.log("");
      });
    },
  }),
  commandUsage,
);

export { commandUsage, diskUsage };
