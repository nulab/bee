import { getClient, openUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getDocument: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  documentUrl: vi.fn(
    (host: string, projectKey: string, docId: string) =>
      `https://${host}/document/${projectKey}/${docId}`,
  ),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

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
    setupMocks();
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    const { view } = await import("./view");
    await view.run?.({ args: { document: "doc-1" } } as never);

    expect(mockClient.getDocument).toHaveBeenCalledWith("doc-1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Meeting Notes"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("important"));
  });

  it("displays emoji when present", async () => {
    setupMocks();
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    const { view } = await import("./view");
    await view.run?.({ args: { document: "doc-1" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\ud83d\udcdd"));
  });

  it("displays body content", async () => {
    setupMocks();
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    const { view } = await import("./view");
    await view.run?.({ args: { document: "doc-1" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Body"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Some document content"));
  });

  it("opens browser with --web flag", async () => {
    setupMocks();

    const { view } = await import("./view");
    await view.run?.({ args: { document: "doc-1", project: "PROJECT", web: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/document/PROJECT/doc-1");
    expect(consola.info).toHaveBeenCalledWith(
      "Opening https://example.backlog.com/document/PROJECT/doc-1 in your browser.",
    );
    expect(mockClient.getDocument).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    mockClient.getDocument.mockResolvedValue(sampleDocument);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { document: "doc-1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
    writeSpy.mockRestore();
  });

  it("hides tags when none exist", async () => {
    setupMocks();
    mockClient.getDocument.mockResolvedValue({ ...sampleDocument, tags: [] });

    const { view } = await import("./view");
    await view.run?.({ args: { document: "doc-1" } } as never);

    // Tags line should not appear when there are no tags
    expect(mockClient.getDocument).toHaveBeenCalledWith("doc-1");
  });
});
