import { type CommandEntry, buildFlagParts, buildUsageLine, loadCommands } from "./commands";

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

type Category = "core" | "project-management" | "config" | "additional";

const CATEGORY_MAP: Record<string, Category> = {
  // Core commands — main Backlog features + authentication
  auth: "core",
  issue: "core",
  pr: "core",
  wiki: "core",
  document: "core",
  notification: "core",
  star: "core",
  watching: "core",
  dashboard: "core",
  browse: "core",
  // Project management — space, project & team administration
  project: "project-management",
  space: "project-management",
  repo: "project-management",
  team: "project-management",
  user: "project-management",
  // Config — Backlog project settings
  category: "config",
  milestone: "config",
  "issue-type": "config",
  status: "config",
  // Additional commands — CLI utilities
  api: "additional",
  completion: "additional",
};

const SECTIONS: { category: Category; heading: string }[] = [
  { category: "core", heading: "Core commands" },
  { category: "project-management", heading: "Project management" },
  { category: "config", heading: "Config" },
  { category: "additional", heading: "Additional commands" },
];

const categoryOf = (entry: CommandEntry): Category =>
  CATEGORY_MAP[entry.parent || entry.name] ?? "additional";

const buildLlmsTxt = async (siteUrl: string): Promise<string> => {
  const commands = await loadCommands();
  const lines: string[] = [HEADER];

  lines.push("## Docs");
  lines.push("");
  lines.push(`- [Getting Started](${siteUrl}/getting-started.md): Installation and basic usage`);
  lines.push(
    `- [Full documentation](${siteUrl}/llms-full.txt): Complete command reference in a single file`,
  );
  lines.push("");

  lines.push("## Commands");
  lines.push("");

  for (const { category, heading } of SECTIONS) {
    const entries = commands.filter((e) => categoryOf(e) === category);
    if (entries.length === 0) {
      continue;
    }
    lines.push(`### ${heading}`);
    lines.push("");
    for (const entry of entries) {
      lines.push(`- [${entry.title}](${siteUrl}/commands/${entry.id}.md): ${entry.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
};

const buildLlmsFullTxt = async (): Promise<string> => {
  const commands = await loadCommands();
  const lines: string[] = [HEADER];

  for (const entry of commands) {
    lines.push(renderCommandMarkdown(entry));
  }

  return lines.join("\n");
};

export { buildLlmsFullTxt, buildLlmsTxt, renderCommandMarkdown };
