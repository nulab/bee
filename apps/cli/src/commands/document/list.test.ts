import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getDocuments: vi.fn(),
  getProjects: vi.fn().mockResolvedValue([{ id: 100, projectKey: "PROJECT" }]),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_, val) => Promise.resolve(val)),
}));

const sampleDocuments = [
  {
    id: "doc-1",
    projectId: 100,
    title: "Meeting Notes",
    plain: "Some content",
    json: "{}",
    statusId: 1,
    emoji: "\ud83d\udcdd",
    attachments: [],
    tags: [],
    createdUser: { name: "Alice" },
    created: "2025-01-01T00:00:00Z",
    updatedUser: { name: "Bob" },
    updated: "2025-01-02T00:00:00Z",
  },
  {
    id: "doc-2",
    projectId: 100,
    title: "Design Doc",
    plain: "Design content",
    json: "{}",
    statusId: 1,
    emoji: null,
    attachments: [],
    tags: [],
    createdUser: { name: "Charlie" },
    created: "2025-01-03T00:00:00Z",
    updatedUser: { name: "Charlie" },
    updated: "2025-01-04T00:00:00Z",
  },
];

describe("document list", () => {
  it("displays document list in tabular format", async () => {
    mockClient.getDocuments.mockResolvedValue(sampleDocuments);

    const { default: list } = await import("./list");
    await list.parseAsync(["-p", "PROJECT"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getDocuments).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Meeting Notes"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("doc-2"));
  });

  it("shows message when no documents found", async () => {
    mockClient.getDocuments.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["-p", "PROJECT"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No documents found.");
  });

  it("passes keyword query parameter", async () => {
    mockClient.getDocuments.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["-p", "PROJECT", "-k", "meeting"], { from: "user" });

    expect(mockClient.getDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "meeting" }),
    );
  });

  it("passes sort and order parameters", async () => {
    mockClient.getDocuments.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["-p", "PROJECT", "--sort", "created", "--order", "asc"], {
      from: "user",
    });

    expect(mockClient.getDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "created", order: "asc" }),
    );
  });

  it("passes count and offset parameters", async () => {
    mockClient.getDocuments.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync(["-p", "PROJECT", "-L", "10", "--offset", "5"], { from: "user" });

    expect(mockClient.getDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ count: 10, offset: 5 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getDocuments.mockResolvedValue(sampleDocuments);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["-p", "PROJECT", "--json"], { from: "user" });
    }, "doc-1");
  });
});
