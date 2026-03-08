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
