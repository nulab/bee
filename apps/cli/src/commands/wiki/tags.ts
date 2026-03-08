import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const tags = new BeeCommand("tags")
  .summary("List wiki tags")
  .description(
    `List wiki tags in a Backlog project.

Tags are labels attached to wiki pages for organization.`,
  )
  .addOption(opt.project())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "List wiki tags", command: "bee wiki tags -p PROJECT" },
    { description: "Output as JSON", command: "bee wiki tags -p PROJECT --json" },
  ])
  .action(async (opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient();

    const result = await client.getWikisTags(opts.project);

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
