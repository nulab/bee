import { type CommandEntry, buildFlagParts, buildUsageLine, loadCommands } from "./commands";

const docFiles = import.meta.glob<string>("../content/docs/**/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

const HEADER = `# bee

bee is a command-line tool for interacting with [Backlog](https://backlog.com/) project management.
It supports issue tracking, pull requests, wikis, notifications, and project administration.
Authenticate with \`bee auth login\`, then set \`BACKLOG_PROJECT\` to target a project.
`;

const renderCommandMarkdown = (entry: CommandEntry): string => {
  const flags = entry.args.filter((a) => a.type !== "positional");
  const positionals = entry.args.filter((a) => a.type === "positional");
  const lines: string[] = [];

  lines.push(`## ${entry.title}`);
  lines.push("");
  lines.push(entry.description);
  lines.push("");

  if (entry.long) {
    lines.push(entry.long);
    lines.push("");
  }

  // Usage
  lines.push("### Usage");
  lines.push("");
  lines.push(`\`\`\`sh\n${buildUsageLine(entry.title, entry.args)}\n\`\`\``);
  lines.push("");

  // Arguments
  if (positionals.length > 0) {
    lines.push("### Arguments");
    lines.push("");
    for (const arg of positionals) {
      let line = `- \`${arg.name.toUpperCase()}\`: ${arg.description ?? ""}`;
      if (arg.valueHint) {
        line += ` ${arg.valueHint}`;
      }
      if (arg.default !== undefined) {
        line += ` (default: \`${String(arg.default)}\`)`;
      }
      lines.push(line);
    }
    lines.push("");
  }

  // Flags
  if (flags.length > 0) {
    lines.push("### Flags");
    lines.push("");
    for (const arg of flags) {
      let line = `- \`${buildFlagParts(arg).join(", ")}\`: ${arg.description ?? ""}`;
      if (arg.default !== undefined) {
        line += ` (default: \`${String(arg.default)}\`)`;
      }
      lines.push(line);
    }
    lines.push("");
  }

  // Examples
  if (entry.examples && entry.examples.length > 0) {
    lines.push("### Examples");
    lines.push("");
    for (const ex of entry.examples) {
      lines.push(ex.description);
      lines.push("");
      lines.push(`\`\`\`sh\n${ex.command}\n\`\`\``);
      lines.push("");
    }
  }

  // Environment variables
  if (entry.environment && entry.environment.length > 0) {
    lines.push("### Environment variables");
    lines.push("");
    for (const [key, desc] of entry.environment) {
      lines.push(`- \`${key}\`: ${desc}`);
    }
    lines.push("");
  }

  return lines.join("\n");
};

const buildLlmsTxt = async (siteUrl: string): Promise<string> => {
  const commands = await loadCommands();
  const lines: string[] = [HEADER];

  lines.push("## Docs");
  lines.push("");
  lines.push(
    `- [Full documentation](${siteUrl}/llms-full.txt): Complete reference in a single file`,
  );
  for (const slug of docSlugs) {
    const raw = docFiles[`${PREFIX}${slug}.mdx`];
    const titleMatch = raw.match(/^title:\s*(.+)$/m);
    const title = titleMatch?.[1] ?? slug;
    lines.push(`- [${title}](${siteUrl}/${slug}.md)`);
  }
  lines.push("");

  lines.push("## Commands");
  lines.push("");
  for (const entry of commands) {
    lines.push(`- [${entry.title}](${siteUrl}/commands/${entry.id}.md): ${entry.description}`);
  }
  lines.push("");

  return lines.join("\n");
};

const PREFIX = "../content/docs/";

const docSlugs = Object.keys(docFiles)
  .filter((key) => !key.endsWith("/index.mdx"))
  .map((key) => key.slice(PREFIX.length).replace(/\.mdx$/, ""));

const renderDocPage = (slug: string): string => {
  const raw = docFiles[`${PREFIX}${slug}.mdx`];
  const body = raw.replace(/^---[\s\S]*?---\s*/, "");
  const titleMatch = raw.match(/^title:\s*(.+)$/m);
  const title = titleMatch?.[1] ?? slug;
  return `## ${title}\n\n${body.trim()}`;
};

const buildLlmsFullTxt = async (): Promise<string> => {
  const commands = await loadCommands();
  const lines: string[] = [HEADER];

  for (const slug of docSlugs) {
    lines.push(renderDocPage(slug));
    lines.push("");
  }

  lines.push("# Command reference");
  lines.push("");

  for (const entry of commands) {
    lines.push(renderCommandMarkdown(entry));
  }

  return lines.join("\n");
};

export { buildLlmsFullTxt, buildLlmsTxt, renderCommandMarkdown };
