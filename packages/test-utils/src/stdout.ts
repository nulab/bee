import { vi, expect } from "vitest";

/**
 * Captures stdout.write calls during the callback and asserts the output
 * contains the expected string. Used for JSON output tests.
 */
export const expectStdoutContaining = async (
  fn: () => Promise<void>,
  expected: string,
): Promise<void> => {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    await fn();
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining(expected));
  } finally {
    writeSpy.mockRestore();
  }
};

/**
 * Creates a test callback that verifies JSON output for a command.
 * Use with it():
 *
 * @example
 * ```typescript
 * it("outputs JSON when --json flag is set",
 *   itOutputsJson(() => import("./list"), ["TEST", "--json"], "Bug", setup)
 * );
 * ```
 */
export const itOutputsJson =
  (
    importCommand: () => Promise<{
      default: { parseAsync: (args: string[], opts: { from: string }) => Promise<void> };
    }>,
    args: string[],
    expectedSubstring: string,
    setup?: () => void | Promise<void>,
  ): (() => Promise<void>) =>
  async () => {
    if (setup) await setup();
    await expectStdoutContaining(async () => {
      const { default: command } = await importCommand();
      await command.parseAsync(args, { from: "user" });
    }, expectedSubstring);
  };
