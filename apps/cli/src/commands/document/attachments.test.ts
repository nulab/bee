import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getDocument: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleAttachments = [
  {
    id: 1,
    name: "report.pdf",
    size: 2_048_576,
    createdUser: { name: "Alice" },
    created: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "screenshot.png",
    size: 512,
    createdUser: { name: "Bob" },
    created: "2025-01-02T00:00:00Z",
  },
];

describe("document attachments", () => {
  it("displays attachment list in tabular format", async () => {
    mockClient.getDocument.mockResolvedValue({
      id: "doc-1",
      attachments: sampleAttachments,
    });

    const { default: attachments } = await import("./attachments");
    await attachments.parseAsync(["doc-1"], { from: "user" });

    expect(mockClient.getDocument).toHaveBeenCalledWith("doc-1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("NAME"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("report.pdf"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("screenshot.png"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
  });

  it("shows message when no attachments found", async () => {
    mockClient.getDocument.mockResolvedValue({
      id: "doc-1",
      attachments: [],
    });

    const { default: attachments } = await import("./attachments");
    await attachments.parseAsync(["doc-1"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No attachments found.");
  });

  it("formats file sizes correctly", async () => {
    mockClient.getDocument.mockResolvedValue({
      id: "doc-1",
      attachments: [
        {
          id: 1,
          name: "small.txt",
          size: 500,
          createdUser: { name: "Alice" },
          created: "2025-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "medium.txt",
          size: 5120,
          createdUser: { name: "Bob" },
          created: "2025-01-02T00:00:00Z",
        },
        {
          id: 3,
          name: "large.txt",
          size: 2_097_152,
          createdUser: { name: "Charlie" },
          created: "2025-01-03T00:00:00Z",
        },
      ],
    });

    const { default: attachments } = await import("./attachments");
    await attachments.parseAsync(["doc-1"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("500 B"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("5.0 KB"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2.0 MB"));
  });

  it("handles null createdUser gracefully", async () => {
    mockClient.getDocument.mockResolvedValue({
      id: "doc-1",
      attachments: [
        {
          id: 1,
          name: "report.pdf",
          size: 2_048_576,
          createdUser: null,
          created: "2025-01-01T00:00:00Z",
        },
      ],
    });

    const { default: attachments } = await import("./attachments");
    await attachments.parseAsync(["doc-1"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unknown"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getDocument.mockResolvedValue({
      id: "doc-1",
      attachments: sampleAttachments,
    });

    await expectStdoutContaining(async () => {
      const { default: attachments } = await import("./attachments");
      await attachments.parseAsync(["doc-1", "--json"], { from: "user" });
    }, "report.pdf");
  });
});
