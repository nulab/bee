import { BeeCommand } from "../../lib/bee-command";

const notification = new BeeCommand("notification").summary("Manage Backlog notifications");

await notification.addCommands([
  import("./list.js"),
  import("./count.js"),
  import("./read.js"),
  import("./read-all.js"),
]);

export default notification;
