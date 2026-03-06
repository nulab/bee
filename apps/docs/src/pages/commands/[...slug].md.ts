import { loadCommands } from "../../lib/commands";
import { renderCommandMarkdown } from "../../lib/llms-txt";

export const getStaticPaths = async () => {
  const commands = await loadCommands();
  return commands.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
};

type Props = Awaited<ReturnType<typeof getStaticPaths>>[number]["props"];

export const GET = ({ props }: { props: Props }) => {
  const content = renderCommandMarkdown(props.entry);
  return new Response(content, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
};
