import { BeeCommand } from "../../lib/bee-command";

const repo = new BeeCommand("repo").summary("Manage Backlog Git repositories");

await repo.addCommands([import("./list.js"), import("./view.js"), import("./clone.js")]);

export default repo;
