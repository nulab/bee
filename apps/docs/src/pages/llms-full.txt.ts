import { buildLlmsFullTxt } from "../lib/llms-txt";

export const GET = async () => {
  const content = await buildLlmsFullTxt();
  return new Response(content, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
