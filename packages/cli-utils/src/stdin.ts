import { text } from "node:stream/consumers";

const readStdin = async (): Promise<string> => {
  const content = await text(process.stdin);
  return content.trim();
};

/**
 * Resolve a flag value that supports reading from stdin.
 *
 * Returns the stdin content when the flag value is falsy (empty or
 * omitted) and stdin is piped. Otherwise returns the original value.
 */
const resolveStdinArg = async (value: string | undefined): Promise<string | undefined> => {
  if (!value && !process.stdin.isTTY) {
    return readStdin();
  }
  return value;
};

export { readStdin, resolveStdinArg };
