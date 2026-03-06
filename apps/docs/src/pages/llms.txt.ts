import { buildLlmsTxt } from "../lib/llms-txt";

const siteUrl = new URL(
  import.meta.env.BASE_URL,
  import.meta.env.SITE ?? "http://localhost:4321",
).href.replace(/\/$/, "");

export const GET = async () => {
  const content = await buildLlmsTxt(siteUrl);
  return new Response(content, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
