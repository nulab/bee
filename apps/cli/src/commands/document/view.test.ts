import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, parseCommand } from "@repo/test-utils";

const mockClient = vi.hoisted(() => ({
  getDocument: vi.fn(),
}));

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
  documentUrl: vi.fn(
    (host: string, projectKey: string, docId: string) =>
      `https://${host}/document/${projectKey}/${docId}`,
  ),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleDocument = {
  id: "doc-1",
  projectId: 100,
  title: "Meeting Notes",
  plain: "Some document content",
  json: "{}",
  statusId: 1,
  emoji: "\ud83d\udcdd",
  attachments: [],
  tags: [{ id: 1, name: "important" }],
  createdUser: { name: "Alice" },
  created: "2025-01-01T00:00:00Z",
  updatedUser: { name: "Bob" },
  updated: "2025-01-02T00:00:00Z",
};

describe("document view", () => {
  it("displays document details", async () => {
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    await parseCommand(() => import("./view"), ["doc-1"]);

    expect(mockClient.getDocument).toHaveBeenCalledWith("doc-1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Meeting Notes"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("important"));
  });

  it("displays emoji when present", async () => {
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    await parseCommand(() => import("./view"), ["doc-1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\ud83d\udcdd"));
  });

  it("displays body content", async () => {
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    await parseCommand(() => import("./view"), ["doc-1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Body"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Some document content"));
  });

  it("opens browser with --web flag", async () => {
    await parseCommand(() => import("./view"), ["doc-1", "--web", "-p", "PROJECT"]);

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/document/PROJECT/doc-1",
      false,
      consola,
    );
    expect(mockClient.getDocument).not.toHaveBeenCalled();
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./view"),
      ["doc-1", "--json"],
      "doc-1",
      () => {
        mockClient.getDocument.mockResolvedValue(sampleDocument);
      },
    ),
  );

  it("hides tags when none exist", async () => {
    mockClient.getDocument.mockResolvedValue({ ...sampleDocument, tags: [] });

    await parseCommand(() => import("./view"), ["doc-1"]);

    expect(mockClient.getDocument).toHaveBeenCalledWith("doc-1");
    const allCalls = vi.mocked(consola.log).mock.calls.map((c) => c[0]);
    expect(allCalls.every((c) => !String(c).includes("Tags"))).toBe(true);
  });

  it("throws error when --web used without --project", async () => {
    await expect(parseCommand(() => import("./view"), ["123", "--web"])).rejects.toThrow(
      "The --project flag is required when using --web.",
    );
  });

  it("handles null createdUser and updatedUser gracefully", async () => {
    mockClient.getDocument.mockResolvedValue({
      ...sampleDocument,
      createdUser: null,
      updatedUser: null,
    });

    await parseCommand(() => import("./view"), ["doc-1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unknown"));
  });

  it("handles null emoji gracefully", async () => {
    mockClient.getDocument.mockResolvedValue({
      ...sampleDocument,
      emoji: null,
    });

    await parseCommand(() => import("./view"), ["doc-1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Meeting Notes"));
  });
});
