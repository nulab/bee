import { Command } from "commander";
import { colorize } from "consola/utils";

type Example = { description: string; command: string };

class BeeCommand extends Command {
  readonly beeExamples: Example[] = [];
  readonly beeEnvVars: [string, string][] = [];

  helpInformation(): string {
    return super.helpInformation() + this._renderExamples() + this._renderEnvVars();
  }

  createCommand(name?: string): BeeCommand {
    return new BeeCommand(name);
  }

  examples(examples: Example[]): this {
    this.beeExamples.push(...examples);
    return this;
  }

  envVars(vars: [string, string][]): this {
    this.beeEnvVars.push(...vars);
    return this;
  }

  async addCommands(mods: Promise<{ default: Command }>[]): Promise<this> {
    const resolved = await Promise.all(mods);
    for (const mod of resolved) {
      this.addCommand(mod.default);
    }
    return this;
  }

  private _renderExamples(): string {
    if (this.beeExamples.length === 0) {
      return "";
    }
    const lines = this.beeExamples.flatMap((ex) => [
      `  # ${ex.description}`,
      `  $ ${ex.command}`,
      "",
    ]);
    return `\n${colorize("bold", "EXAMPLES")}\n${lines.join("\n")}`;
  }

  private _renderEnvVars(): string {
    const fromOptions: [string, string][] = this.options
      .filter((opt) => opt.envVar)
      .map((opt) => [opt.envVar!, opt.description ?? ""]);
    const vars = [...fromOptions, ...this.beeEnvVars];
    if (vars.length === 0) {
      return "";
    }
    const maxLen = Math.max(...vars.map(([k]) => k.length));
    const lines = vars.map(([k, d]) => `  ${k.padEnd(maxLen + 3)}${d}`);
    return `\n${colorize("bold", "ENVIRONMENT VARIABLES")}\n${lines.join("\n")}`;
  }
}

const ENV_AUTH: [string, string][] = [["BACKLOG_API_KEY", "Authenticate with an API key"]];
const ENV_PROJECT: [string, string] = ["BACKLOG_PROJECT", "Default project ID or project key"];
const ENV_REPO: [string, string] = ["BACKLOG_REPO", "Default repository name"];

export { BeeCommand, type Example, ENV_AUTH, ENV_PROJECT, ENV_REPO };
