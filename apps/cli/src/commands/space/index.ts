import { BeeCommand } from "../../lib/bee-command";

const space = new BeeCommand("space").summary("Manage space information");

await space.addCommands([
  import("./info.js"),
  import("./activities.js"),
  import("./disk-usage.js"),
  import("./notification.js"),
]);

export default space;
