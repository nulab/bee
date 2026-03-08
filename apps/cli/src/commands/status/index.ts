import { BeeCommand } from "../../lib/bee-command";

const status = new BeeCommand("status").summary("Manage project statuses");

await status.addCommands([
  import("./list.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
]);

export default status;
