import { BeeCommand } from "../../lib/bee-command";

const space = new BeeCommand("space").summary("Manage space information");

await space.addCommands([import("./activities.js")]);

export default space;
