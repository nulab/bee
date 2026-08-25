import { type Command } from "commander";

type CompletionEntry = {
  name: string;
  summary: string;
};

/**
 * Commander lists `help` as a subcommand of every parent. Completing it would
 * offer a command users reach through `--help`, so it never reaches a script.
 */
const isListable = (cmd: Command): boolean => cmd.name() !== "help";

const toEntry = (cmd: Command): CompletionEntry => ({
  name: cmd.name(),
  summary: cmd.summary() || cmd.description(),
});

const commandEntries = (program: Command): CompletionEntry[] =>
  program.commands.filter(isListable).map(toEntry);

/**
 * zsh's `_describe` takes `name:description` pairs, so a colon inside a summary
 * would end the name early and truncate the completion label.
 */
const escapeZsh = (text: string): string => text.replaceAll(":", String.raw`\:`);

const escapeDoubleQuoted = (text: string): string => text.replaceAll(/(["$`\\])/g, String.raw`\$1`);

const renderBash = (entries: CompletionEntry[]): string => `# bash completion for bee
# Add to ~/.bashrc:
#   eval "$(bee completion bash)"

_bee_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local commands="${entries.map((entry) => entry.name).join(" ")}"

  if [ "\${COMP_CWORD}" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
  fi
}

complete -F _bee_completions bee
`;

const renderZsh = (entries: CompletionEntry[]): string => {
  const pairs = entries
    .map((entry) => `      '${escapeZsh(entry.name)}:${escapeZsh(entry.summary)}'`)
    .join(" \\\n");

  return `#compdef bee
# zsh completion for bee
# Add to ~/.zshrc:
#   eval "$(bee completion zsh)"

_bee() {
  local -a commands
  commands=(
${pairs}
  )

  _arguments '1: :->command' '*:: :->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
  esac
}

compdef _bee bee
`;
};

const renderFish = (entries: CompletionEntry[]): string => {
  const lines = entries
    .map(
      (entry) =>
        `complete -c bee -n "__fish_use_subcommand" -a "${entry.name}" -d "${escapeDoubleQuoted(entry.summary)}"`,
    )
    .join("\n");

  return `# fish completion for bee
# Add to ~/.config/fish/completions/bee.fish:
#   bee completion fish > ~/.config/fish/completions/bee.fish

complete -c bee -e
${lines}
`;
};

/**
 * Null-prototyped so a shell name that collides with an inherited property
 * ("toString") fails validation instead of resolving to a non-renderer.
 */
const RENDERERS: Record<string, (entries: CompletionEntry[]) => string> = Object.assign(
  Object.create(null) as Record<string, (entries: CompletionEntry[]) => string>,
  { bash: renderBash, zsh: renderZsh, fish: renderFish },
);

const SUPPORTED_SHELLS = Object.keys(RENDERERS);

const isSupportedShell = (shell: string): boolean => shell in RENDERERS;

/** Render the completion script for `shell` from the program's top-level commands. */
const renderCompletionScript = (shell: string, program: Command): string =>
  RENDERERS[shell](commandEntries(program));

export { SUPPORTED_SHELLS, isSupportedShell, renderCompletionScript };
