#compdef bee
# zsh completion for bee
# Add to ~/.zshrc:
#   eval "$(bee completion zsh)"

_bee() {
  local -a commands
  commands=(
      'auth:auth commands' \
      'project:project commands' \
      'issue:issue commands' \
      'document:document commands' \
      'notification:notification commands' \
      'pr:pr commands' \
      'repo:repo commands' \
      'team:team commands' \
      'user:user commands' \
      'webhook:webhook commands' \
      'wiki:wiki commands' \
      'category:category commands' \
      'milestone:milestone commands' \
      'issue-type:issue-type commands' \
      'space:space commands' \
      'status:status commands' \
      'star:star commands' \
      'watching:watching commands' \
      'dashboard:dashboard commands' \
      'browse:browse commands' \
      'api:api commands' \
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
