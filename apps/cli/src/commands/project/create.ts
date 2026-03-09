import { getClient, projectUrl } from "@repo/backlog-utils";
import { outputResult, promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const create = new BeeCommand("create")
  .summary("Create a project")
  .description(
    `Project key must consist of uppercase letters, numbers, and underscores. Omitted fields will be prompted interactively.`,
  )
  .option("-k, --key <key>", "Project key")
  .option("-n, --name <name>", "Project name")
  .option("--chart-enabled", "Enable chart")
  .option("--subtasking-enabled", "Enable subtasking")
  .option(
    "--project-leader-can-edit-project-leader",
    "Allow project administrators to manage each other",
  )
  .option("--text-formatting-rule <rule>", "Formatting rules")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH])
  .examples([
    {
      description: "Create a project with key and name",
      command: 'bee project create --key TEST --name "Test Project"',
    },
    {
      description: "Create a project with markdown formatting",
      command:
        'bee project create --key TEST --name "Test Project" --text-formatting-rule markdown',
    },
    {
      description: "Create a project interactively",
      command: "bee project create",
    },
  ])
  .action(async (opts) => {
    const { client, host } = await getClient(opts.space);

    const key = await promptRequired("Project key:", opts.key);
    const name = await promptRequired("Project name:", opts.name);

    const project = await client.postProject({
      key,
      name,
      chartEnabled: opts.chartEnabled ?? false,
      subtaskingEnabled: opts.subtaskingEnabled ?? false,
      projectLeaderCanEditProjectLeader: opts.projectLeaderCanEditProjectLeader,
      textFormattingRule: (opts.textFormattingRule ?? "markdown") as "backlog" | "markdown",
    });

    const jsonArg = opts.json === true ? "" : opts.json;
    outputResult(project, { ...opts, json: jsonArg }, (data) => {
      consola.success(`Created project ${data.projectKey}: ${data.name}`);
      consola.info(projectUrl(host, data.projectKey));
    });
  });

export default create;
