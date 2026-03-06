import { spawn } from "node:child_process";
import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Clone a Backlog Git repository.

Fetches the repository metadata to obtain the clone URL, then runs
\`git clone\` as a subprocess. By default the SSH URL is used; pass
\`--http\` to clone over HTTPS instead.

Use \`--directory\` to specify a custom destination directory.`,

  examples: [
    { description: "Clone a repository", command: "bee repo clone api-server -p PROJECT_KEY" },
    {
      description: "Clone to a specific directory",
      command: "bee repo clone api-server -p PROJECT_KEY --directory ./dest",
    },
    {
      description: "Clone using HTTP URL",
      command: "bee repo clone api-server -p PROJECT_KEY --http",
    },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

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

const clone = withUsage(
  defineCommand({
    meta: {
      name: "clone",
      description: "Clone a repository",
    },
    args: {
      ...outputArgs,
      repository: {
        type: "positional",
        description: "Repository name or ID",
        required: true,
      },
      project: {
        type: "string",
        alias: "p",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
      directory: {
        type: "string",
        alias: "d",
        description: "Directory to clone into",
      },
      http: {
        type: "boolean",
        description: "Clone using HTTP URL instead of SSH",
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const repo = await client.getGitRepository(args.project, args.repository);

      if (args.json !== undefined) {
        outputResult(repo, args, () => {});
        return;
      }

      const cloneUrl = args.http ? repo.httpUrl : repo.sshUrl;
      const gitArgs = ["clone", cloneUrl];

      if (args.directory) {
        gitArgs.push(args.directory);
      }

      consola.info(`Cloning into '${args.directory ?? repo.name}'...`);
      await gitClone(gitArgs);
    },
  }),
  commandUsage,
);

export { commandUsage, clone };
