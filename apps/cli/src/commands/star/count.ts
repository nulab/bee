import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const count = new BeeCommand("count")
  .summary("Count received stars")
  .description(`Defaults to the authenticated user if no user ID is given.`)
  .argument("[user]", "User ID")
  .option("--since <yyyy-MM-dd>", "Count stars received on or after this date")
  .option("--until <yyyy-MM-dd>", "Count stars received on or before this date")
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Count your stars", command: "bee star count" },
    { description: "Count stars for a specific user", command: "bee star count 12345" },
    {
      description: "Count stars in a date range",
      command: "bee star count --since 2025-01-01 --until 2025-12-31",
    },
    { description: "Output as JSON", command: "bee star count --json" },
  ])
  .action(async (user, opts) => {
    const { client } = await getClient();

    let userId: number;
    if (user) {
      userId = Number(user);
    } else {
      const myself = await client.getMyself();
      userId = myself.id;
    }

    const params: { since?: string; until?: string } = {};
    if (opts.since) {
      params.since = opts.since;
    }
    if (opts.until) {
      params.until = opts.until;
    }

    const result = await client.getUserStarsCount(userId, params);

    outputResult(result, opts, (data) => {
      consola.log(String(data.count));
    });
  });

export default count;
