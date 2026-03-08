import { describe, expect, it, vi } from "vitest";

describe("completion", () => {
  it("generates bash completion script", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { default: completion } = await import("./completion");
    await completion.parseAsync(["bash"], { from: "user" });

    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain("_bee_completions");
    expect(output).toContain("complete -F _bee_completions bee");
    expect(output).toContain("issue");
    expect(output).toContain("project");
    writeSpy.mockRestore();
  });

  it("generates zsh completion script", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { default: completion } = await import("./completion");
    await completion.parseAsync(["zsh"], { from: "user" });

    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain("#compdef bee");
    expect(output).toContain("_bee");
    expect(output).toContain("compdef _bee bee");
    expect(output).toContain("issue");
    writeSpy.mockRestore();
  });

  it("generates fish completion script", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { default: completion } = await import("./completion");
    await completion.parseAsync(["fish"], { from: "user" });

    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain("complete -c bee");
    expect(output).toContain("__fish_use_subcommand");
    expect(output).toContain("issue");
    writeSpy.mockRestore();
  });

  it("throws error for unsupported shell", async () => {
    const { default: completion } = await import("./completion");

    await expect(completion.parseAsync(["powershell"], { from: "user" })).rejects.toThrow(
      "Unsupported shell",
    );
  });
});
