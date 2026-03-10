import consola from "consola";
import { BeeCommand } from "./lib/bee-command";
import { handleError } from "./lib/error";
import pkg from "../package.json" with { type: "json" };

consola.options.formatOptions.date = false;

const program = new BeeCommand("bee").version(pkg.version).description(pkg.description ?? "");

await program.addCommands([
  import("./commands/auth/index.js"),
  import("./commands/project/index.js"),
  import("./commands/issue/index.js"),
  import("./commands/document/index.js"),
  import("./commands/notification/index.js"),
  import("./commands/pr/index.js"),
  import("./commands/repo/index.js"),
  import("./commands/team/index.js"),
  import("./commands/user/index.js"),
  import("./commands/wiki/index.js"),
  import("./commands/category/index.js"),
  import("./commands/milestone/index.js"),
  import("./commands/issue-type/index.js"),
  import("./commands/space/index.js"),
  import("./commands/status/index.js"),
  import("./commands/star/index.js"),
  import("./commands/watching/index.js"),
  import("./commands/dashboard.js"),
  import("./commands/browse.js"),
  import("./commands/api.js"),
  import("./commands/completion.js"),
]);

program.exitOverride();

try {
  await program.parseAsync();
} catch (error) {
  handleError(error);
}
