import { describe, expect, it } from "vitest";
import { BeeCommand } from "./bee-command";
import { SUPPORTED_SHELLS, isSupportedShell, renderCompletionScript } from "./completion-script";

const program = (): BeeCommand => new BeeCommand("bee");

const withCommands = (...commands: BeeCommand[]): BeeCommand => {
  const bee = program();
  for (const command of commands) {
    bee.addCommand(command);
  }
  return bee;
};

describe("renderCompletionScript", () => {
  it("lists every top-level command in registry order for bash", () => {
    const bee = withCommands(
      new BeeCommand("auth").summary("Authenticate bee with Backlog"),
      new BeeCommand("issue").summary("Manage Backlog issues"),
      new BeeCommand("issue-type").summary("Manage project issue types"),
    );

    expect(renderCompletionScript("bash", bee)).toContain('local commands="auth issue issue-type"');
  });

  it("describes each command with its summary for zsh", () => {
    const bee = withCommands(new BeeCommand("issue").summary("Manage Backlog issues"));

    expect(renderCompletionScript("zsh", bee)).toContain("'issue:Manage Backlog issues'");
  });

  it("describes each command with its summary for fish", () => {
    const bee = withCommands(new BeeCommand("issue").summary("Manage Backlog issues"));

    expect(renderCompletionScript("fish", bee)).toContain(
      'complete -c bee -n "__fish_use_subcommand" -a "issue" -d "Manage Backlog issues"',
    );
  });

  it("omits commander's built-in help subcommand", () => {
    const bee = withCommands(
      new BeeCommand("issue").summary("Manage Backlog issues"),
      new BeeCommand("help").summary("display help for command"),
    );

    for (const shell of SUPPORTED_SHELLS) {
      expect(renderCompletionScript(shell, bee)).not.toContain("help");
    }
  });

  it("falls back to the description when a command has no summary", () => {
    const bee = withCommands(
      new BeeCommand("api").description("Make an authenticated API request"),
    );

    expect(renderCompletionScript("zsh", bee)).toContain("'api:Make an authenticated API request'");
  });

  it("escapes a colon in a summary so zsh keeps the whole description", () => {
    const bee = withCommands(new BeeCommand("watching").summary("Manage watching: subscriptions"));

    expect(renderCompletionScript("zsh", bee)).toContain(
      String.raw`'watching:Manage watching\: subscriptions'`,
    );
  });

  it("escapes a double quote in a summary so fish keeps the argument intact", () => {
    const bee = withCommands(new BeeCommand("issue").summary(String.raw`Manage "Backlog" issues`));

    expect(renderCompletionScript("fish", bee)).toContain(
      String.raw`-d "Manage \"Backlog\" issues"`,
    );
  });

  it("keeps the entry points each shell sources", () => {
    const bee = withCommands(new BeeCommand("issue").summary("Manage Backlog issues"));

    expect(renderCompletionScript("bash", bee)).toContain("complete -F _bee_completions bee");
    expect(renderCompletionScript("zsh", bee)).toContain("#compdef bee");
    expect(renderCompletionScript("zsh", bee)).toContain("compdef _bee bee");
    expect(renderCompletionScript("fish", bee)).toContain("complete -c bee -e");
  });
});

describe("isSupportedShell", () => {
  it("accepts each supported shell", () => {
    expect(SUPPORTED_SHELLS).toEqual(["bash", "zsh", "fish"]);
    for (const shell of SUPPORTED_SHELLS) {
      expect(isSupportedShell(shell)).toBe(true);
    }
  });

  it("rejects a shell with no completion script", () => {
    expect(isSupportedShell("powershell")).toBe(false);
  });

  it("rejects an inherited Object property masquerading as a shell", () => {
    expect(isSupportedShell("toString")).toBe(false);
  });
});
