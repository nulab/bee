import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const tags = new BeeCommand("tags")
  .summary("List wiki tags")
  .description(
    `List wiki tags in a Backlog project.

Tags are labels attached to wiki pages for organization.`,
  )
  .argument("<project>", "Project ID or project key")
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List wiki tags", command: "bee wiki tags PROJECT" },
    { description: "Output as JSON", command: "bee wiki tags PROJECT --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const result = await client.getWikisTags(project);

    const json = opts.json === true ? "" : opts.json;
    outputResult(result, { json }, (data) => {
      if (data.length === 0) {
        consola.info("No wiki tags found.");
        return;
      }

      for (const tag of data) {
        consola.log(tag.name);
      }
    });
  });

export default tags;
