import { getClient } from "@repo/backlog-utils";
import { formatSize, outputResult, printDefinitionList } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const diskUsage = new BeeCommand("disk-usage")
  .summary("Display space disk usage")
  .description(
    `Display disk usage of the Backlog space.

Shows the total capacity and a breakdown of disk usage by category:
issues, wikis, files, Subversion, Git, and Git LFS.`,
  )
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View disk usage", command: "bee space disk-usage" },
    { description: "Output as JSON", command: "bee space disk-usage --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient();

    const usage = await client.getSpaceDiskUsage();

    outputResult(usage, opts, (data) => {
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
  });

export default diskUsage;
