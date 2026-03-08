import { BeeCommand } from "../../lib/bee-command";

const document = new BeeCommand("document").summary("Manage Backlog documents");

await document.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./tree.js"),
  import("./attachments.js"),
  import("./create.js"),
  import("./delete.js"),
]);

export default document;
