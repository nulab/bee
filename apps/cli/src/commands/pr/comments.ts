import { getClient } from "@repo/backlog-utils";
import { formatDate, outputResult, parseArg, vInteger } from "@repo/cli-utils";
import consola from "consola";
import * as v from "valibot";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const comments = new BeeCommand("comments")
  .summary("List comments on a pull request")
  .description(`Displays all comments in chronological order.`)
  .argument("<number>", "Pull request number")
  .addOption(opt.project())
  .addOption(opt.repo())
  .addOption(opt.minId())
  .addOption(opt.maxId())
  .addOption(opt.count())
  .addOption(opt.order())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    {
      description: "List pull request comments",
      command: "bee pr comments 42 -p PROJECT -R repo",
    },
    { description: "Output as JSON", command: "bee pr comments 42 -p PROJECT -R repo --json" },
  ])
  .action(async (number, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const prNumber = parseArg(vInteger, number, "number");

    const prComments = await client.getPullRequestComments(opts.project, opts.repo, prNumber, {
      minId: parseArg(v.optional(vInteger), opts.minId, "--min-id"),
      maxId: parseArg(v.optional(vInteger), opts.maxId, "--max-id"),
      order: opts.order ?? "asc",
      count: parseArg(v.optional(vInteger), opts.count, "--count"),
    });

    const json = opts.json === true ? "" : opts.json;
    outputResult(prComments, { json }, (data) => {
      const contentComments = data.filter((c) => c.content);

      if (contentComments.length === 0) {
        consola.info("No comments found.");
        return;
      }

      consola.log("");
      for (const comment of contentComments) {
        consola.log(`  ${comment.createdUser.name} (${formatDate(comment.created)}):`);
        consola.log(
          comment.content
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n"),
        );
        consola.log("");
      }
    });
  });

export default comments;
