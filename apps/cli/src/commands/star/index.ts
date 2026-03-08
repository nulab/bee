import { BeeCommand } from "../../lib/bee-command";

const star = new BeeCommand("star").summary("Manage stars");

await star.addCommands([
  import("./add.js"),
  import("./list.js"),
  import("./count.js"),
  import("./remove.js"),
]);

export default star;
