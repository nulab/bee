import { BeeCommand } from "../../lib/bee-command";

const watching = new BeeCommand("watching").summary("Manage watching (issue subscriptions)");

await watching.addCommands([
  import("./list.js"),
  import("./add.js"),
  import("./view.js"),
  import("./delete.js"),
  import("./read.js"),
]);

export default watching;
