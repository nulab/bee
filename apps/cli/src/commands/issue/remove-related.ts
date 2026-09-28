import { getClient, resolveIssueId } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { type Entity } from "backlog-js";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const removeRelated = new BeeCommand("remove-related")
  .summary("Remove related issues from an issue")
  .argument("<issue>", "Issue ID or issue key")
  .argument("<targets...>", "Issue IDs or issue keys to unrelate")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Remove a related issue",
      command: "bee issue remove-related PROJECT-1 PROJECT-2",
    },
    {
      description: "Remove several related issues",
      command: "bee issue remove-related PROJECT-1 PROJECT-2 OTHER-5",
    },
  ])
  .action(async (issue: string, targets: string[], opts) => {
    const { client } = await getClient(opts.space);

    const targetIds = await Promise.all(targets.map((value) => resolveIssueId(client, value)));

    const results: Entity.Issue.RelatedIssue[] = [];
    for (const targetIssueId of targetIds) {
      const unrelated = await client.removeRelatedIssue(issue, targetIssueId);
      results.push(unrelated);
      // Reported per relation rather than in outputResult's formatter, so an
      // API error part-way through still shows which relations were removed.
      if (opts.json === undefined) {
        consola.success(`Removed related issue ${unrelated.issueKey} from ${issue}`);
      }
    }

    outputResult(results, opts, () => {});
  });

export default removeRelated;
