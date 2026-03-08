import { getClient } from "@repo/backlog-utils";
import { UserError } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const add = new BeeCommand("add")
  .summary("Add a star")
  .description(`Specify exactly one target: \`--issue\` (accepts key or ID), \`--comment\`, \`--wiki\`, or \`--pr-comment\`.`)
  .addOption(opt.issue())
  .option("--comment <number>", "Comment ID to star")
  .option("--wiki <number>", "Wiki page ID to star")
  .option("--pr-comment <number>", "Pull request comment ID to star")
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Star an issue by key", command: "bee star add --issue PROJECT-123" },
    { description: "Star an issue by ID", command: "bee star add --issue 12345" },
    { description: "Star a comment", command: "bee star add --comment 67890" },
    { description: "Star a wiki page", command: "bee star add --wiki 111" },
    { description: "Star a pull request comment", command: "bee star add --pr-comment 222" },
  ])
  .action(async (opts) => {
    const flags = [opts.issue, opts.comment, opts.wiki, opts.prComment].filter(
      (v) => v !== undefined,
    );

    if (flags.length === 0) {
      throw new UserError(
        "Exactly one of --issue, --comment, --wiki, or --pr-comment must be provided.",
      );
    }

    if (flags.length > 1) {
      throw new UserError(
        "Only one of --issue, --comment, --wiki, or --pr-comment can be provided at a time.",
      );
    }

    const { client } = await getClient();

    if (opts.issue) {
      const issue = /^\d+$/.test(opts.issue)
        ? { id: Number(opts.issue) }
        : await client.getIssue(opts.issue);
      const issueId = issue.id;
      await client.postStar({ issueId });
      consola.success(`Starred issue ${opts.issue}.`);
    } else if (opts.comment) {
      await client.postStar({ commentId: Number(opts.comment) });
      consola.success(`Starred comment ${opts.comment}.`);
    } else if (opts.wiki) {
      await client.postStar({ wikiId: Number(opts.wiki) });
      consola.success(`Starred wiki ${opts.wiki}.`);
    } else if (opts.prComment) {
      await client.postStar({ pullRequestCommentId: Number(opts.prComment) });
      consola.success(`Starred pull request comment ${opts.prComment}.`);
    }
  });

export default add;
