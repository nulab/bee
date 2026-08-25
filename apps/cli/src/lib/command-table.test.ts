import { describe, expect, it } from "vitest";
import { BeeCommand } from "./bee-command";
import { MARKER_BEGIN, MARKER_END, applyCommandTable, renderCommandTable } from "./command-table";

const program = (): BeeCommand => new BeeCommand("bee");

describe("renderCommandTable", () => {
  it("lists each subcommand of a parent command", () => {
    const bee = program();
    bee.addCommand(
      new BeeCommand("issue")
        .summary("Manage issues")
        .addCommand(new BeeCommand("list").summary("List issues"))
        .addCommand(new BeeCommand("view").summary("View an issue")),
    );

    expect(renderCommandTable(bee)).toContain("| `bee issue` | `list`, `view` |");
  });

  it("shows the summary instead of subcommands for a leaf command", () => {
    const bee = program();
    bee.addCommand(new BeeCommand("dashboard").summary("Show a summary of your Backlog activity"));

    expect(renderCommandTable(bee)).toContain(
      "| `bee dashboard` | Show a summary of your Backlog activity |",
    );
  });

  it("omits commander's built-in help subcommand", () => {
    const bee = program();
    const issue = new BeeCommand("issue").summary("Manage issues");
    issue.addCommand(new BeeCommand("list").summary("List issues"));
    issue.addCommand(new BeeCommand("help").summary("display help"));
    bee.addCommand(issue);
    bee.addCommand(new BeeCommand("help").summary("display help"));

    const table = renderCommandTable(bee);
    expect(table).toContain("| `bee issue` |");
    expect(table).toContain("`list`");
    expect(table).not.toContain("`bee help`");
  });

  it("falls back to the description when a command has no summary", () => {
    const bee = program();
    bee.addCommand(new BeeCommand("api").description("Make an authenticated API request"));

    expect(renderCommandTable(bee)).toContain("| `bee api` | Make an authenticated API request |");
  });

  it("escapes pipe characters so a summary cannot break the table", () => {
    const bee = program();
    bee.addCommand(new BeeCommand("pipe").summary("Reads a|b"));

    expect(renderCommandTable(bee)).toContain(String.raw`Reads a\|b`);
  });

  it("pads every row to the same width", () => {
    const bee = program();
    bee.addCommand(
      new BeeCommand("issue")
        .summary("Manage issues")
        .addCommand(new BeeCommand("list").summary("List issues")),
    );
    bee.addCommand(new BeeCommand("dashboard").summary("Show a summary of your Backlog activity"));

    const widths = new Set(
      renderCommandTable(bee)
        .split("\n")
        .map((line) => line.length),
    );
    expect(widths.size).toBe(1);
  });
});

const withMarkers = (inner: string): string =>
  `# Skill\n\n${MARKER_BEGIN}\n${inner}\n${MARKER_END}\n\nTrailing prose.\n`;

describe("applyCommandTable", () => {
  it("replaces stale table content between the markers", () => {
    const bee = program();
    bee.addCommand(new BeeCommand("dashboard").summary("Show a summary"));

    const result = applyCommandTable(withMarkers("| `bee webhook` | `list` |"), bee);

    expect(result).not.toContain("webhook");
    expect(result).toContain("`bee dashboard`");
  });

  it("preserves content outside the markers", () => {
    const bee = program();
    bee.addCommand(new BeeCommand("dashboard").summary("Show a summary"));

    const result = applyCommandTable(withMarkers("stale"), bee);

    expect(result.startsWith("# Skill\n")).toBe(true);
    expect(result.endsWith("Trailing prose.\n")).toBe(true);
  });

  it("is idempotent, so a second run produces no diff", () => {
    const bee = program();
    bee.addCommand(new BeeCommand("dashboard").summary("Show a summary"));

    const once = applyCommandTable(withMarkers("stale"), bee);
    expect(applyCommandTable(once, bee)).toBe(once);
  });

  it("throws when the markers are missing", () => {
    expect(() => applyCommandTable("# Skill\n\nNo markers here.\n", program())).toThrow(
      /Missing generated-table markers/,
    );
  });

  it("throws when the end marker precedes the begin marker", () => {
    expect(() => applyCommandTable(`${MARKER_END}\n${MARKER_BEGIN}\n`, program())).toThrow(
      /Missing generated-table markers/,
    );
  });
});
