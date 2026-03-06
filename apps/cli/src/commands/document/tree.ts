import { getClient } from "@repo/backlog-utils";
import { outputArgs, outputResult } from "@repo/cli-utils";
import { type Entity } from "backlog-js";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, ENV_AUTH, ENV_PROJECT, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Display the document tree structure of a Backlog project.

Shows the hierarchical structure of documents with tree-style indentation.`,

  examples: [
    { description: "Show document tree", command: "bee document tree PROJECT" },
    { description: "Output as JSON", command: "bee document tree PROJECT --json" },
  ],

  annotations: {
    environment: [...ENV_AUTH, ENV_PROJECT],
  },
};

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

const tree = withUsage(
  defineCommand({
    meta: {
      name: "tree",
      description: "Display document tree",
    },
    args: {
      ...outputArgs,
      project: {
        type: "positional",
        description: "Project ID or project key",
        required: true,
        default: process.env.BACKLOG_PROJECT,
      },
    },
    async run({ args }) {
      const { client } = await getClient();

      const docTree = await client.getDocumentTree(args.project);

      outputResult(docTree, args, (data) => {
        if (!data.activeTree || data.activeTree.children.length === 0) {
          consola.info("No documents found.");
          return;
        }

        const lines = renderTree(data.activeTree.children);
        for (const line of lines) {
          consola.log(line);
        }
      });
    },
  }),
  commandUsage,
);

export { commandUsage, tree };
