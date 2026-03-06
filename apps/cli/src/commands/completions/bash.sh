# bash completion for bee
# Add to ~/.bashrc:
#   eval "$(bee completion bash)"

_bee_completions() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local commands="auth project issue document notification pr repo team user webhook wiki category milestone issue-type space status star watching dashboard browse api completion"

  if [ "${COMP_CWORD}" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "${commands}" -- "${cur}") )
  fi
}

complete -F _bee_completions bee
