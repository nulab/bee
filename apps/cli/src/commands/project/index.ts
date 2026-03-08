import { BeeCommand } from "../../lib/bee-command";

const project = new BeeCommand("project").summary("Manage Backlog projects");

await project.addCommands([
  import("./list.js"),
  import("./view.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
  import("./users.js"),
  import("./activities.js"),
  import("./add-user.js"),
  import("./remove-user.js"),
]);

export default project;
