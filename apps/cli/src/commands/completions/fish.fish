# fish completion for bee
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
complete -c bee -n "__fish_use_subcommand" -a "webhook" -d "webhook commands"
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
