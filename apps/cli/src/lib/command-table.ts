import { type Command } from "commander";

const MARKER_BEGIN = "<!-- BEGIN GENERATED COMMAND TABLE -->";
const MARKER_END = "<!-- END GENERATED COMMAND TABLE -->";

type CommandRow = {
  command: string;
  subcommands: string[];
  summary: string;
};

/**
 * Commander lists `help` as a subcommand of every parent. It is not part of the
 * CLI surface an agent chooses between, so it never reaches the table.
 */
const isListable = (cmd: Command): boolean => cmd.name() !== "help";

const toRow = (cmd: Command): CommandRow => ({
  command: `bee ${cmd.name()}`,
  subcommands: cmd.commands.filter(isListable).map((sub) => sub.name()),
  summary: cmd.summary() || cmd.description(),
});

const escapeCell = (text: string): string => text.replaceAll("|", String.raw`\|`);

/** Render a row's second column: subcommands when it has them, else its summary. */
const detailCell = (row: CommandRow): string =>
  row.subcommands.length > 0
    ? row.subcommands.map((name) => `\`${name}\``).join(", ")
    : escapeCell(row.summary);

const padCells = (rows: string[][], widths: number[]): string[] =>
  rows.map((cells) => `| ${cells.map((cell, i) => cell.padEnd(widths[i])).join(" | ")} |`);

const renderCommandTable = (program: Command): string => {
  const rows = program.commands.filter(isListable).map(toRow);
  const header = ["Command", "Subcommands"];
  const body = rows.map((row) => [`\`${row.command}\``, detailCell(row)]);
  const widths = header.map((_, i) => Math.max(...[header, ...body].map((r) => r[i].length)));
  const separator = `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`;

  return [...padCells([header], widths), separator, ...padCells(body, widths)].join("\n");
};

/** Replace the marked region of `source` with a freshly rendered table. */
const applyCommandTable = (source: string, program: Command): string => {
  const begin = source.indexOf(MARKER_BEGIN);
  const end = source.indexOf(MARKER_END);
  if (begin === -1 || end === -1 || end < begin) {
    throw new Error(
      `Missing generated-table markers. Expected both ${MARKER_BEGIN} and ${MARKER_END}, in that order.`,
    );
  }

  const before = source.slice(0, begin + MARKER_BEGIN.length);
  const after = source.slice(end);
  return `${before}\n\n${renderCommandTable(program)}\n\n${after}`;
};

export { MARKER_BEGIN, MARKER_END, applyCommandTable, renderCommandTable };
