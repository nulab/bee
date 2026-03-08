import { BeeCommand } from "../../lib/bee-command";

const auth = new BeeCommand("auth").summary("Authenticate bee with Backlog");

await auth.addCommands([
  import("./login.js"),
  import("./logout.js"),
  import("./status.js"),
  import("./token.js"),
  import("./refresh.js"),
  import("./switch.js"),
]);

export default auth;
