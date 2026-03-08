import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { UserError } from "@repo/cli-utils";
import { BeeCommand } from "../lib/bee-command";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const shellExtensions: Record<string, string> = {
  bash: "sh",
  zsh: "zsh",
  fish: "fish",
};

const loadCompletionScript = (shell: string): string =>
  readFileSync(resolve(__dirname, `completions/${shell}.${shellExtensions[shell]}`), "utf8");

const completion = new BeeCommand("completion")
  .summary("Generate shell completion scripts")
  .description(
    `Generate shell completion scripts for bee.

The generated script should be sourced in your shell's configuration file.
Follow the instructions in the output for your specific shell.`,
  )
  .argument("<shell>", "Shell to generate completions for")
  .examples([
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
  ])
  .action((shell: string) => {
    switch (shell) {
      case "bash":
      case "zsh":
      case "fish": {
        process.stdout.write(loadCompletionScript(shell));
        break;
      }
      default: {
        throw new UserError(`Unsupported shell: "${shell}". Supported shells: bash, zsh, fish.`);
      }
    }
  });

export default completion;
