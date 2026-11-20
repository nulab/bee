import consola from "consola";
import { describe, expect, it, vi } from "vite-plus/test";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({});
const { getDocumentComments } = vi.hoisted(() => ({ getDocumentComments: vi.fn() }));

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
  getDocumentComments,
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const entry = (id: string, name: string | null, plain: string) => ({
  id,
  documentId: "doc-1",
  content: "{}",
  plain,
  createdUserId: 1,
  created: "2026-04-01T00:00:00Z",
  updatedUserId: 1,
  updated: "2026-04-01T00:00:00Z",
  createdUser: name === null ? null : { id: 1, name },
});

const reply = (id: string, name: string, plain: string) => ({
  ...entry(id, name, plain),
  commentId: "c-1",
});

const thread = (
  id: string,
  name: string | null,
  plain: string,
  replies: ReturnType<typeof reply>[] = [],
) => ({
  ...entry(id, name, plain),
  statusId: 0,
  commentType: "comment",
  replies,
});

const loggedLines = (): string[] =>
  vi
    .mocked(consola.log)
    .mock.calls.flatMap(([message]) => String(message).split("\n"))
    .map((line) => line.trim());

describe("document comments", () => {
  it("shows each comment with its author and body", async () => {
    vi.mocked(getDocumentComments).mockResolvedValue([
      thread("c-1", "Alice", "What's this?"),
      thread("c-2", "Bob", "It's OK."),
    ]);

    await parseCommand(() => import("./comments"), ["doc-1"]);

    expect(getDocumentComments).toHaveBeenCalledWith(mockClient, "doc-1");
    const lines = loggedLines();
    expect(lines).toContain("What's this?");
    expect(lines).toContain("It's OK.");
    expect(lines.some((line) => line.startsWith("Alice"))).toBe(true);
    expect(lines.some((line) => line.startsWith("Bob"))).toBe(true);
  });

  it("shows replies after the comment they answer and before the next comment", async () => {
    vi.mocked(getDocumentComments).mockResolvedValue([
      thread("c-1", "Alice", "What's this?", [reply("r-1", "Carol", "The one we talked about.")]),
      thread("c-2", "Bob", "It's OK."),
    ]);

    await parseCommand(() => import("./comments"), ["doc-1"]);

    const lines = loggedLines();
    const parent = lines.indexOf("What's this?");
    const replyBody = lines.indexOf("The one we talked about.");
    const next = lines.indexOf("It's OK.");
    expect(replyBody).toBeGreaterThan(parent);
    expect(replyBody).toBeLessThan(next);
    expect(lines.slice(parent, replyBody).some((line) => line.includes("Carol"))).toBe(true);
  });

  it("shows Unknown as the author when the user has been deleted", async () => {
    vi.mocked(getDocumentComments).mockResolvedValue([thread("c-1", null, "Orphan")]);

    await parseCommand(() => import("./comments"), ["doc-1"]);

    expect(loggedLines().some((line) => line.startsWith("Unknown"))).toBe(true);
  });

  it("shows message when no comments found", async () => {
    vi.mocked(getDocumentComments).mockResolvedValue([]);

    await parseCommand(() => import("./comments"), ["doc-1"]);

    expect(consola.info).toHaveBeenCalledWith("No comments found.");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./comments"),
      ["doc-1", "--json"],
      "What's this?",
      () => {
        vi.mocked(getDocumentComments).mockResolvedValue([thread("c-1", "Alice", "What's this?")]);
      },
    ),
  );
});
