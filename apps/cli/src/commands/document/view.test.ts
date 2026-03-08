import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getDocument: vi.fn(),
};

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

    const { default: view } = await import("./view");
    await view.parseAsync(["doc-1"], { from: "user" });

    expect(mockClient.getDocument).toHaveBeenCalledWith("doc-1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Meeting Notes"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("important"));
  });

  it("displays emoji when present", async () => {
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    const { default: view } = await import("./view");
    await view.parseAsync(["doc-1"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\ud83d\udcdd"));
  });

  it("displays body content", async () => {
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    const { default: view } = await import("./view");
    await view.parseAsync(["doc-1"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Body"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Some document content"));
  });

  it("opens browser with --web flag", async () => {
    const { default: view } = await import("./view");
    await view.parseAsync(["doc-1", "--web", "-p", "PROJECT"], { from: "user" });

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/document/PROJECT/doc-1",
      false,
      consola,
    );
    expect(mockClient.getDocument).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    await expectStdoutContaining(async () => {
      const { default: view } = await import("./view");
      await view.parseAsync(["doc-1", "--json"], { from: "user" });
    }, "doc-1");
  });

  it("hides tags when none exist", async () => {
    mockClient.getDocument.mockResolvedValue({ ...sampleDocument, tags: [] });

    const { default: view } = await import("./view");
    await view.parseAsync(["doc-1"], { from: "user" });

    expect(mockClient.getDocument).toHaveBeenCalledWith("doc-1");
    const allCalls = vi.mocked(consola.log).mock.calls.map((c) => c[0]);
    expect(allCalls.every((c) => !String(c).includes("Tags"))).toBe(true);
  });

  it("throws error when --web used without --project", async () => {
    const { default: view } = await import("./view");
    await expect(view.parseAsync(["123", "--web"], { from: "user" })).rejects.toThrow(
      "The --project flag is required when using --web.",
    );
  });
});
