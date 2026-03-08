import { BeeCommand } from "../../lib/bee-command";

const user = new BeeCommand("user").summary("Manage Backlog users");

await user.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./me.js"),
  import("./activities.js"),
]);

export default user;
