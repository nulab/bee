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

const OPTIONAL_GROUPS = new Set([
  "webhook",
  "wiki",
  "space",
  "project",
  "team",
  "category",
  "milestone",
  "issue-type",
  "status",
]);

const buildLlmsTxt = async (siteUrl: string): Promise<string> => {
  const commands = await loadCommands();
  const coreCommands = commands.filter((e) => !OPTIONAL_GROUPS.has(e.parent));
  const optionalCommands = commands.filter((e) => OPTIONAL_GROUPS.has(e.parent));
  const lines: string[] = [HEADER];

  lines.push("## Docs");
  lines.push("");
  lines.push(
    `- [Getting Started](${siteUrl}/guides/getting-started.md): Installation and basic usage`,
  );
  lines.push(
    `- [Full documentation](${siteUrl}/llms-full.txt): Complete command reference in a single file`,
  );
  lines.push("");

  lines.push("## Commands");
  lines.push("");
  for (const entry of coreCommands) {
    lines.push(`- [${entry.title}](${siteUrl}/commands/${entry.id}.md): ${entry.description}`);
  }
  lines.push("");

  lines.push("## Optional");
  lines.push("");
  for (const entry of optionalCommands) {
    lines.push(`- [${entry.title}](${siteUrl}/commands/${entry.id}.md): ${entry.description}`);
  }
  lines.push("");

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
