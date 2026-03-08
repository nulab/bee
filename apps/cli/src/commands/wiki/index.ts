import { BeeCommand } from "../../lib/bee-command";

const wiki = new BeeCommand("wiki").summary("Manage Backlog wiki pages");

await wiki.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./count.js"),
  import("./tags.js"),
  import("./history.js"),
  import("./attachments.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
]);

export default wiki;
