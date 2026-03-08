import { BeeCommand } from "../../lib/bee-command";

const team = new BeeCommand("team").summary("Manage Backlog teams");

await team.addCommands([import("./list.js"), import("./view.js")]);

export default team;
