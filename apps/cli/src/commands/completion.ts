import { UserError } from "@repo/cli-utils";
import { BeeCommand } from "../lib/bee-command";
import {
  SUPPORTED_SHELLS,
  isSupportedShell,
  renderCompletionScript,
} from "../lib/completion-script";

/**
 * The registry imports this module, so importing it back at the top level would
 * close a cycle and leave `loadCommands` undefined here. Loading it inside the
 * action defers the lookup until every module has finished evaluating.
 */
const buildProgram = async (): Promise<BeeCommand> => {
  const { loadCommands } = await import("./registry.js");
  const program = new BeeCommand("bee");
  await program.addCommands(loadCommands());
  return program;
};

const completion = new BeeCommand("completion")
  .summary("Generate shell completion scripts")
  .description(`Supported shells: bash, zsh, fish. Source the output in your shell configuration.`)
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
  .action(async (shell: string) => {
    if (!isSupportedShell(shell)) {
      throw new UserError(
        `Unsupported shell: "${shell}". Supported shells: ${SUPPORTED_SHELLS.join(", ")}.`,
      );
    }
    process.stdout.write(renderCompletionScript(shell, await buildProgram()));
  });

export default completion;
