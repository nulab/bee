import { BeeCommand } from "../../lib/bee-command";

const team = new BeeCommand("team").summary("Manage Backlog teams");

await team.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
]);

export default team;
