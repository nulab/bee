import { BeeCommand } from "../../lib/bee-command";

const issue = new BeeCommand("issue").summary("Manage Backlog issues");

await issue.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./status.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./close.js"),
  import("./reopen.js"),
  import("./attachments.js"),
  import("./comment.js"),
  import("./count.js"),
  import("./delete.js"),
]);

export default issue;
