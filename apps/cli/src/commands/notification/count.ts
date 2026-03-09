import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const parseReadFilter = (value: string | undefined): boolean | undefined => {
  if (value === undefined || value === "all") {
    return undefined;
  }
  return value === "read";
};

const count = new BeeCommand("count")
  .summary("Count notifications")
  .description(
    `By default, counts all notifications regardless of read status.

For details, see:  
https://developer.nulab.com/docs/backlog/api/2/count-notification/`,
  )
  .option(
    "--already-read <value>",
    "Filter by read status. If omitted, count all. {read|unread|all}",
  )
  .option(
    "--resource-already-read <value>",
    "Filter by resource read status. If omitted, count all. {read|unread|all}",
  )
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "Count all notifications", command: "bee notification count" },
    {
      description: "Count only unread notifications",
      command: "bee notification count --already-read unread",
    },
    {
      description: "Count only read notifications",
      command: "bee notification count --already-read read",
    },
    { description: "Output as JSON", command: "bee notification count --json" },
  ])
  .action(async (opts) => {
    const { client } = await getClient(opts.space);

    const alreadyRead = parseReadFilter(opts.alreadyRead);
    const resourceAlreadyRead = parseReadFilter(opts.resourceAlreadyRead);

    const params: Record<string, boolean> = {};
    if (alreadyRead !== undefined) {
      params.alreadyRead = alreadyRead;
    }
    if (resourceAlreadyRead !== undefined) {
      params.resourceAlreadyRead = resourceAlreadyRead;
    }

    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- backlog-js types require both fields but API accepts partial params
    const result = await client.getNotificationsCount(
      params as unknown as Parameters<typeof client.getNotificationsCount>[0],
    );

    outputResult(result, opts, (data) => {
      consola.log(String(data.count));
    });
  });

export default count;
