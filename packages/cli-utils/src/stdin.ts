import { text } from "node:stream/consumers";

const readStdin = async (): Promise<string> => {
  const content = await text(process.stdin);
  return content.trim();
};

export { readStdin };
