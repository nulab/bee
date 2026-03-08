import { getClient } from "@repo/backlog-utils";
import { outputResult } from "@repo/cli-utils";
import { type Entity } from "backlog-js";
import consola from "consola";
import { BeeCommand, ENV_AUTH, ENV_PROJECT } from "../../lib/bee-command";
import * as opt from "../../lib/common-options";

const renderNode = (
  node: Entity.Document.DocumentTreeNode,
  prefix: string,
  isLast: boolean,
): string[] => {
  const connector = isLast ? "\u2514\u2500\u2500" : "\u251c\u2500\u2500";
  const emoji = node.emoji ? `${node.emoji} ` : "";
  const name = node.name ?? node.id;
  const lines: string[] = [`${prefix}${connector} ${emoji}${name}`];

  const childPrefix = prefix + (isLast ? "    " : "\u2502   ");
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    lines.push(...renderNode(child, childPrefix, i === node.children.length - 1));
  }

  return lines;
};

const renderTree = (children: Entity.Document.DocumentTreeNode[]): string[] => {
  const lines: string[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    lines.push(...renderNode(child, "", i === children.length - 1));
  }
  return lines;
};

const tree = new BeeCommand("tree")
  .summary("Display document tree")
  .description(
    `Display the document tree structure of a Backlog project.

Shows the hierarchical structure of documents with tree-style indentation.`,
  )
  .argument("[project]", "Project ID or project key", process.env.BACKLOG_PROJECT)
  .addOption(opt.json())
  .envVars([...ENV_AUTH, ENV_PROJECT])
  .examples([
    { description: "Show document tree", command: "bee document tree PROJECT" },
    { description: "Output as JSON", command: "bee document tree PROJECT --json" },
  ])
  .action(async (project, opts) => {
    const { client } = await getClient();

    const docTree = await client.getDocumentTree(project);

    outputResult(docTree, opts, (data) => {
      if (!data.activeTree || data.activeTree.children.length === 0) {
        consola.info("No documents found.");
        return;
      }

      const lines = renderTree(data.activeTree.children);
      for (const line of lines) {
        consola.log(line);
      }
    });
  });

export default tree;
