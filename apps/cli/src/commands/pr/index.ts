import { BeeCommand } from "../../lib/bee-command";

const pr = new BeeCommand("pr").summary("Manage Backlog pull requests");

await pr.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./comments.js"),
  import("./status.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./comment.js"),
  import("./count.js"),
]);

export default pr;
