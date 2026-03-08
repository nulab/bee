import { BeeCommand } from "../../lib/bee-command";

const category = new BeeCommand("category").summary("Manage project categories");

await category.addCommands([
  import("./list.js"),
  import("./create.js"),
  import("./edit.js"),
  import("./delete.js"),
]);

export default category;
