import { BeeCommand } from "../../lib/bee-command";

const issueType = new BeeCommand("issue-type").summary("Manage project issue types");

await issueType.addCommands([
  import("./list.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
]);

export default issueType;
