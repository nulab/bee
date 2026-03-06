import { getCollection } from "astro:content";

export const getStaticPaths = async () => {
  const docs = await getCollection("docs");
  return docs.map((entry) => ({
    params: { slug: entry.id.replace(/\.mdx?$/, "") },
    props: { entry },
  }));
};

type Props = Awaited<ReturnType<typeof getStaticPaths>>[number]["props"];

export const GET = ({ props }: { props: Props }) => {
  const { entry } = props;
  const {title} = entry.data;
  const content = `# ${title}\n\n${entry.body}`;
  return new Response(content, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
};
