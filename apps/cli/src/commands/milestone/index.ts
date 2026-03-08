import { BeeCommand } from "../../lib/bee-command";

const milestone = new BeeCommand("milestone").summary("Manage project milestones");

await milestone.addCommands([
  import("./list.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
]);

export default milestone;
