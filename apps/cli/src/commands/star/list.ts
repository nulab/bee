import { getClient } from "@repo/backlog-utils";
import { type Row, formatDate, outputResult, printTable } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const list = new BeeCommand("list")
  .summary("List received stars")
  .description(`Defaults to the authenticated user if no user ID is given.`)
  .argument("[user]", "User ID")
  .addOption(opt.json())
  .envVars([...ENV_AUTH])
  .examples([
    { description: "List your stars", command: "bee star list" },
    { description: "List stars for a specific user", command: "bee star list 12345" },
    { description: "Output as JSON", command: "bee star list --json" },
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

    const stars = await client.getUserStars(userId, {});

    outputResult(stars, opts, (data) => {
      if (data.length === 0) {
        consola.info("No stars found.");
        return;
      }

      const rows: Row[] = data.map((s) => [
        { header: "ID", value: String(s.id) },
        { header: "TITLE", value: s.title },
        { header: "PRESENTER", value: s.presenter.name },
        { header: "DATE", value: formatDate(s.created) },
      ]);

      printTable(rows);
    });
  });

export default list;
