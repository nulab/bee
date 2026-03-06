import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../lib/command-usage";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const commandUsage: CommandUsage = {
  long: `Generate shell completion scripts for bee.

The generated script should be sourced in your shell's configuration file.
Follow the instructions in the output for your specific shell.`,

  examples: [
    {
      description: "Set up completions for bash (add to ~/.bashrc)",
      command: "echo 'eval \"$(bee completion bash)\"' >> ~/.bashrc",
    },
    {
      description: "Set up completions for zsh (add to ~/.zshrc)",
      command: "echo 'eval \"$(bee completion zsh)\"' >> ~/.zshrc",
    },
    {
      description: "Set up completions for fish",
      command: "bee completion fish > ~/.config/fish/completions/bee.fish",
    },
  ],
};

const shellExtensions: Record<string, string> = {
  bash: "sh",
  zsh: "zsh",
  fish: "fish",
};

const loadCompletionScript = (shell: string): string =>
  readFileSync(resolve(__dirname, `completions/${shell}.${shellExtensions[shell]}`), "utf8");

const completion = withUsage(
  defineCommand({
    meta: {
      name: "completion",
      description: "Generate shell completion scripts",
    },
    args: {
      shell: {
        type: "positional",
        description: "Shell type",
        required: true,
        valueHint: "{bash|zsh|fish}",
      },
    },
    run({ args }) {
      switch (args.shell) {
        case "bash":
        case "zsh":
        case "fish": {
          process.stdout.write(loadCompletionScript(args.shell));
          break;
        }
        default: {
          consola.error(`Unsupported shell: "${args.shell}". Supported shells: bash, zsh, fish.`);
          process.exit(1);
        }
      }
    },
  }),
  commandUsage,
);

export { commandUsage, completion };
