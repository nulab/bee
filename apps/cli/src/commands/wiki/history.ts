import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const history = new BeeCommand("history")
  .summary("View wiki page history")
  .description(`Shows version number, updater, and update date for each revision.`)
  .argument("<wiki>", "Wiki page ID")
  .addOption(opt.minId())
  .addOption(opt.maxId())
  .addOption(opt.count())
  .addOption(opt.order())
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "View wiki page history", command: "bee wiki history 12345" },
    {
      description: "View history in ascending order",
      command: "bee wiki history 12345 --order asc",
    },
    { description: "Output as JSON", command: "bee wiki history 12345 --json" },
  ])
  .action(async (wiki, opts) => {
    const { client } = await getClient(opts.space);

    const histories = await client.getWikisHistory(Number(wiki), {
      minId: opts.minId ? Number(opts.minId) : undefined,
      maxId: opts.maxId ? Number(opts.maxId) : undefined,
      count: opts.count ? Number(opts.count) : undefined,
      order: opts.order,
    });

    outputResult(histories, opts, (data) => {
      if (data.length === 0) {
        consola.info("No history found.");
        return;
      }

      const rows: Row[] = data.map(
        (h: { version: number; createdUser: { name: string }; created: string }) => [
          { header: "VERSION", value: String(h.version) },
          { header: "UPDATED BY", value: h.createdUser.name },
          { header: "UPDATED", value: formatDate(h.created) },
        ],
      );

      printTable(rows);
    });
  });

export default history;
