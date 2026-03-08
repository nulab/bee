import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

describe("completion", () => {
  it("generates bash completion script", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { completion } = await import("./completion");
    completion.run?.({ args: { shell: "bash" } } as never);

    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain("_bee_completions");
    expect(output).toContain("complete -F _bee_completions bee");
    expect(output).toContain("issue");
    expect(output).toContain("project");
    writeSpy.mockRestore();
  });

  it("generates zsh completion script", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { completion } = await import("./completion");
    completion.run?.({ args: { shell: "zsh" } } as never);

    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain("#compdef bee");
    expect(output).toContain("_bee");
    expect(output).toContain("compdef _bee bee");
    expect(output).toContain("issue");
    writeSpy.mockRestore();
  });

  it("generates fish completion script", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { completion } = await import("./completion");
    completion.run?.({ args: { shell: "fish" } } as never);

    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain("complete -c bee");
    expect(output).toContain("__fish_use_subcommand");
    expect(output).toContain("issue");
    writeSpy.mockRestore();
  });

  it("throws error for unsupported shell", async () => {
    const { completion } = await import("./completion");

    expect(() => completion.run?.({ args: { shell: "powershell" } } as never)).toThrow(
      "Unsupported shell",
    );
  });
});
