import { UserError } from "@repo/cli-utils";
import { BeeCommand } from "../lib/bee-command";

const COMPLETION_SCRIPTS: Record<string, string> = {
  bash: `# bash completion for bee
# Add to ~/.bashrc:
#   eval "$(bee completion bash)"

_bee_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local commands="auth project issue document notification pr repo team user wiki category milestone issue-type space status star watching dashboard browse api completion"

  if [ "\${COMP_CWORD}" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
  fi
}

complete -F _bee_completions bee
`,
  zsh: `#compdef bee
# zsh completion for bee
# Add to ~/.zshrc:
#   eval "$(bee completion zsh)"

_bee() {
  local -a commands
  commands=(
      'auth:auth commands' \\
      'project:project commands' \\
      'issue:issue commands' \\
      'document:document commands' \\
      'notification:notification commands' \\
      'pr:pr commands' \\
      'repo:repo commands' \\
      'team:team commands' \\
      'user:user commands' \\
      'wiki:wiki commands' \\
      'category:category commands' \\
      'milestone:milestone commands' \\
      'issue-type:issue-type commands' \\
      'space:space commands' \\
      'status:status commands' \\
      'star:star commands' \\
      'watching:watching commands' \\
      'dashboard:dashboard commands' \\
      'browse:browse commands' \\
      'api:api commands' \\
      'completion:completion commands'
  )

  _arguments '1: :->command' '*:: :->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
  esac
}

compdef _bee bee
`,
  fish: `# fish completion for bee
# Add to ~/.config/fish/completions/bee.fish:
#   bee completion fish > ~/.config/fish/completions/bee.fish

complete -c bee -e
complete -c bee -n "__fish_use_subcommand" -a "auth" -d "auth commands"
complete -c bee -n "__fish_use_subcommand" -a "project" -d "project commands"
complete -c bee -n "__fish_use_subcommand" -a "issue" -d "issue commands"
complete -c bee -n "__fish_use_subcommand" -a "document" -d "document commands"
complete -c bee -n "__fish_use_subcommand" -a "notification" -d "notification commands"
complete -c bee -n "__fish_use_subcommand" -a "pr" -d "pr commands"
complete -c bee -n "__fish_use_subcommand" -a "repo" -d "repo commands"
complete -c bee -n "__fish_use_subcommand" -a "team" -d "team commands"
complete -c bee -n "__fish_use_subcommand" -a "user" -d "user commands"
complete -c bee -n "__fish_use_subcommand" -a "wiki" -d "wiki commands"
complete -c bee -n "__fish_use_subcommand" -a "category" -d "category commands"
complete -c bee -n "__fish_use_subcommand" -a "milestone" -d "milestone commands"
complete -c bee -n "__fish_use_subcommand" -a "issue-type" -d "issue-type commands"
complete -c bee -n "__fish_use_subcommand" -a "space" -d "space commands"
complete -c bee -n "__fish_use_subcommand" -a "status" -d "status commands"
complete -c bee -n "__fish_use_subcommand" -a "star" -d "star commands"
complete -c bee -n "__fish_use_subcommand" -a "watching" -d "watching commands"
complete -c bee -n "__fish_use_subcommand" -a "dashboard" -d "dashboard commands"
complete -c bee -n "__fish_use_subcommand" -a "browse" -d "browse commands"
complete -c bee -n "__fish_use_subcommand" -a "api" -d "api commands"
complete -c bee -n "__fish_use_subcommand" -a "completion" -d "completion commands"
`,
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
  .action((shell: string) => {
    const script = COMPLETION_SCRIPTS[shell];
    if (!script) {
      throw new UserError(
        `Unsupported shell: "${shell}". Supported shells: ${Object.keys(COMPLETION_SCRIPTS).join(", ")}.`,
      );
    }
    process.stdout.write(script);
  });

export default completion;
