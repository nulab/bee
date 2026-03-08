import { getClient } from "@repo/backlog-utils";
import { formatDate, outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT, ENV_REPO } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const comments = new BeeCommand("comments")
  .summary("List comments on a pull request")
  .description(
    `List comments on a Backlog pull request.

Displays all comments in chronological order with the author and date.`,
  )
  .argument("<number>", "Pull request number")
  .addOption(opt.project())
  .addOption(opt.repo())
  .addOption(opt.minId())
  .addOption(opt.maxId())
  .addOption(opt.count())
  .addOption(opt.order())
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT, ENV_REPO])
  .examples([
    {
      description: "List pull request comments",
      command: "bee pr comments 42 -p PROJECT -R repo",
    },
    { description: "Output as JSON", command: "bee pr comments 42 -p PROJECT -R repo --json" },
  ])
  .action(async (number, _opts, cmd) => {
    const opts = await resolveOptions(cmd);
    const { client } = await getClient();

    const prNumber = Number(number);

    const prComments = await client.getPullRequestComments(
      opts.project as string,
      opts.repo as string,
      prNumber,
      {
        minId: opts.minId ? Number(opts.minId) : undefined,
        maxId: opts.maxId ? Number(opts.maxId) : undefined,
        order: (opts.order as "asc" | "desc") ?? "asc",
        count: opts.count ? Number(opts.count) : undefined,
      },
    );

    const json = opts.json === true ? "" : (opts.json as string | undefined);
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
