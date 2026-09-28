import { getClient, resolveIssueId } from "@repo/backlog-utils";
import { UserError, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { type Entity } from "backlog-js";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const addRelated = new BeeCommand("add-related")
  .summary("Add related issues to an issue")
  .description(
    `Each issue can have up to 50 related issues. Relating an issue that is already related does nothing.`,
  )
  .argument("<issue>", "Issue ID or issue key")
  .argument("<targets...>", "Issue IDs or issue keys to relate")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Relate one issue", command: "bee issue add-related PROJECT-1 PROJECT-2" },
    {
      description: "Relate several issues",
      command: "bee issue add-related PROJECT-1 PROJECT-2 OTHER-5",
    },
  ])
  .action(async (issue: string, targets: string[], opts) => {
    const { client } = await getClient(opts.space);

    const [issueId, ...targetIds] = await Promise.all(
      [issue, ...targets].map((value) => resolveIssueId(client, value)),
    );
    const selfIndex = targetIds.indexOf(issueId);
    if (selfIndex !== -1) {
      throw new UserError(`Cannot relate "${targets[selfIndex]}" to itself.`);
    }

    const results: Entity.Issue.RelatedIssue[] = [];
    for (const targetIssueId of targetIds) {
      const related = await client.addRelatedIssue(issue, { targetIssueId });
      results.push(related);
      // Reported per relation rather than in outputResult's formatter, so an
      // API error part-way through still shows which relations were added.
      if (opts.json === undefined) {
        consola.success(`Added related issue ${related.issueKey} to ${issue}`);
      }
    }

    outputResult(results, opts, () => {});
  });

export default addRelated;
