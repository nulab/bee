import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getDocumentTree: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

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
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    const { default: tree } = await import("./tree");
    await tree.parseAsync(["-p", "PROJECT"], { from: "user" });

    expect(mockClient.getDocumentTree).toHaveBeenCalledWith("PROJECT");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Getting Started"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Installation"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("API Reference"));
  });

  it("displays emoji in tree nodes", async () => {
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    const { default: tree } = await import("./tree");
    await tree.parseAsync(["-p", "PROJECT"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\ud83d\ude80"));
  });

  it("shows message when no documents found", async () => {
    mockClient.getDocumentTree.mockResolvedValue({
      projectId: "100",
      activeTree: { id: "root", children: [] },
    });

    const { default: tree } = await import("./tree");
    await tree.parseAsync(["-p", "PROJECT"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No documents found.");
  });

  it("shows message when activeTree is undefined", async () => {
    mockClient.getDocumentTree.mockResolvedValue({
      projectId: "100",
    });

    const { default: tree } = await import("./tree");
    await tree.parseAsync(["-p", "PROJECT"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No documents found.");
  });

  it("falls back to id when name is null", async () => {
    mockClient.getDocumentTree.mockResolvedValue({
      projectId: "100",
      activeTree: {
        id: "root",
        children: [
          {
            id: "doc-no-name",
            name: null,
            children: [],
          },
        ],
      },
    });

    const { default: tree } = await import("./tree");
    await tree.parseAsync(["-p", "PROJECT"], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("doc-no-name"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    await expectStdoutContaining(async () => {
      const { default: tree } = await import("./tree");
      await tree.parseAsync(["-p", "PROJECT", "--json"], { from: "user" });
    }, "doc-1");
  });

  it("renders tree connectors correctly", async () => {
    mockClient.getDocumentTree.mockResolvedValue(sampleTree);

    const { default: tree } = await import("./tree");
    await tree.parseAsync(["-p", "PROJECT"], { from: "user" });

    // First child uses ├── connector
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\u251c\u2500\u2500"));
    // Last child uses └── connector
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("\u2514\u2500\u2500"));
  });
});
