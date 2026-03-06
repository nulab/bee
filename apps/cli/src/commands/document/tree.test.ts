import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getDocumentTree: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

const sampleTree = {
  projectId: "100",
  activeTree: {
    id: "root",
    children: [
      {
        id: "doc-1",
        name: "Getting Started",
        emoji: "\ud83d\ude80",
        children: [
          {
            id: "doc-2",
            name: "Installation",
            children: [],
          },
        ],
      },
      {
        id: "doc-3",
        name: "API Reference",
        children: [],
      },
    ],
  },
};

describe("document tree", () => {
  it("displays tree structure", async () => {
    setupMocks();
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    const { tree } = await import("./tree");
    await tree.run?.({ args: { project: "PROJECT" } } as never);

    expect(mockClient.getDocumentTree).toHaveBeenCalledWith("PROJECT");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Getting Started"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Installation"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("API Reference"));
  });

  it("displays emoji in tree nodes", async () => {
    setupMocks();
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    const { tree } = await import("./tree");
    await tree.run?.({ args: { project: "PROJECT" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\ud83d\ude80"));
  });

  it("shows message when no documents found", async () => {
    setupMocks();
    mockClient.getDocumentTree.mockResolvedValue({
      projectId: "100",
      activeTree: { id: "root", children: [] },
    });

    const { tree } = await import("./tree");
    await tree.run?.({ args: { project: "PROJECT" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No documents found.");
  });

  it("shows message when activeTree is undefined", async () => {
    setupMocks();
    mockClient.getDocumentTree.mockResolvedValue({
      projectId: "100",
    });

    const { tree } = await import("./tree");
    await tree.run?.({ args: { project: "PROJECT" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No documents found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { tree } = await import("./tree");
    await tree.run?.({ args: { project: "PROJECT", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("doc-1"));
    writeSpy.mockRestore();
  });

  it("renders tree connectors correctly", async () => {
    setupMocks();
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    const { tree } = await import("./tree");
    await tree.run?.({ args: { project: "PROJECT" } } as never);

    // First child uses ├── connector
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\u251c\u2500\u2500"));
    // Last child uses └── connector
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\u2514\u2500\u2500"));
  });
});
