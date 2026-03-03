import { afterEach, describe, expect, it, vi } from "vitest";
import { readStdin } from "#/stdin.js";

/**
 * Create a mock async iterable that yields the given buffers,
 * compatible with the `process.stdin` interface used by `readStdin`.
 */
const createMockStdin = (chunks: Buffer[]) =>
  ({
    [Symbol.asyncIterator]: async function* generate() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  }) as unknown as typeof process.stdin;

describe("readStdin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("複数チャンクを結合して文字列を返す", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(
      createMockStdin([Buffer.from("hello "), Buffer.from("world")]),
    );

    const result = await readStdin();
    expect(result).toBe("hello world");
  });

  it("空入力の場合は空文字列を返す", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(createMockStdin([]));

    const result = await readStdin();
    expect(result).toBe("");
  });

  it("前後の空白を trim する", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(
      createMockStdin([Buffer.from("  content with spaces  \n")]),
    );

    const result = await readStdin();
    expect(result).toBe("content with spaces");
  });

  it("単一チャンクでも正しく読み取る", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(
      createMockStdin([Buffer.from("single chunk")]),
    );

    const result = await readStdin();
    expect(result).toBe("single chunk");
  });
});
