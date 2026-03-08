import { BeeCommand } from "../../lib/bee-command";

const webhook = new BeeCommand("webhook").summary("Manage project webhooks");

await webhook.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
]);

export default webhook;
