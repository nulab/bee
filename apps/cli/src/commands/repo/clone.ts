import { spawn } from "node:child_process";
import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";
import { resolveOptions } from "../../lib/required-option";

const gitClone = (gitArgs: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn("git", gitArgs, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`git clone exited with code ${code}`));
      }
    });
  });

const clone = new BeeCommand("clone")
  .summary("Clone a repository")
  .description(`By default the SSH URL is used; pass \`--http\` to clone over HTTPS instead.`)
  .argument("<repository>", "Repository name or ID")
  .addOption(opt.project())
  .option("-d, --directory <path>", "Directory to clone into")
  .option("--http", "Clone using HTTP URL instead of SSH")
  .addOption(opt.json())
  .addOption(opt.space())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Clone a repository", command: "bee repo clone api-server -p PROJECT_KEY" },
    {
      description: "Clone to a specific directory",
      command: "bee repo clone api-server -p PROJECT_KEY --directory ./dest",
    },
    {
      description: "Clone using HTTP URL",
      command: "bee repo clone api-server -p PROJECT_KEY --http",
    },
  ])
  .action(async (repository, opts, cmd) => {
    await resolveOptions(cmd);
    const { client } = await getClient(opts.space);

    const repo = await client.getGitRepository(opts.project, repository);

    if (opts.json !== undefined) {
      outputResult(repo, opts, () => {});
      return;
    }

    const cloneUrl = opts.http ? repo.httpUrl : repo.sshUrl;
    const gitArgs = ["clone", cloneUrl];

    if (opts.directory) {
      gitArgs.push(opts.directory);
    }

    consola.info(`Cloning into '${opts.directory ?? repo.name}'...`);
    await gitClone(gitArgs);
  });

export default clone;
