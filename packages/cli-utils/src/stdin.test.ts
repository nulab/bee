import { afterEach, describe, expect, it, vi } from "vitest";
import { readStdin, resolveStdinArg } from "./stdin";

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

  it("concatenates multiple chunks and returns a string", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(
      createMockStdin([Buffer.from("hello "), Buffer.from("world")]),
    );

    const result = await readStdin();
    expect(result).toBe("hello world");
  });

  it("returns empty string for empty input", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(createMockStdin([]));

    const result = await readStdin();
    expect(result).toBe("");
  });

  it("trims leading and trailing whitespace", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(
      createMockStdin([Buffer.from("  content with spaces  \n")]),
    );

    const result = await readStdin();
    expect(result).toBe("content with spaces");
  });

  it("reads a single chunk correctly", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValue(
      createMockStdin([Buffer.from("single chunk")]),
    );

    const result = await readStdin();
    expect(result).toBe("single chunk");
  });
});

describe("resolveStdinArg", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads stdin when value is empty and stdin is piped", async () => {
    const mock = createMockStdin([Buffer.from("piped content")]);
    Object.defineProperty(mock, "isTTY", { value: undefined });
    vi.spyOn(process, "stdin", "get").mockReturnValue(mock);

    const result = await resolveStdinArg("");
    expect(result).toBe("piped content");
  });

  it("reads stdin when value is undefined and stdin is piped", async () => {
    const mock = createMockStdin([Buffer.from("piped content")]);
    Object.defineProperty(mock, "isTTY", { value: undefined });
    vi.spyOn(process, "stdin", "get").mockReturnValue(mock);

    const result = await resolveStdinArg(undefined);
    expect(result).toBe("piped content");
  });

  it("returns the value as-is when it is a non-empty string", async () => {
    const result = await resolveStdinArg("explicit body");
    expect(result).toBe("explicit body");
  });

  it("returns undefined when value is undefined and stdin is TTY", async () => {
    const mock = createMockStdin([]);
    Object.defineProperty(mock, "isTTY", { value: true });
    vi.spyOn(process, "stdin", "get").mockReturnValue(mock);

    const result = await resolveStdinArg(undefined);
    expect(result).toBeUndefined();
  });

  it("returns empty string when value is empty and stdin is TTY", async () => {
    const mock = createMockStdin([]);
    Object.defineProperty(mock, "isTTY", { value: true });
    vi.spyOn(process, "stdin", "get").mockReturnValue(mock);

    const result = await resolveStdinArg("");
    expect(result).toBe("");
  });
});
