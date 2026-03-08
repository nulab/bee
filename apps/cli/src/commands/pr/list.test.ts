import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getPullRequests: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const samplePullRequests = [
  {
    number: 1,
    summary: "Add feature A",
    status: { id: 1, name: "Open" },
    assignee: { name: "Alice" },
  },
  {
    number: 2,
    summary: "Fix bug B",
    status: { id: 3, name: "Merged" },
    assignee: null,
  },
];

describe("pr list", () => {
  it("displays pull request list in tabular format", async () => {
    mockClient.getPullRequests.mockResolvedValue(samplePullRequests);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getPullRequests).toHaveBeenCalledWith("PROJ", "repo", expect.any(Object));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Add feature A"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix bug B"));
  });

  it("shows message when no pull requests found", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No pull requests found.");
  });

  it("shows Unassigned for pull requests without assignee", async () => {
    mockClient.getPullRequests.mockResolvedValue([samplePullRequests[1]]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("passes status filter parameter", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo", status: "open" } } as never);

    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ statusId: [1] }),
    );
  });

  it("throws error for unknown status name", async () => {
    const { list } = await import("./list");
    await expect(
      list.run?.({ args: { project: "PROJ", repo: "repo", status: "invalid" } } as never),
    ).rejects.toThrow('Unknown status "invalid"');
  });

  it("passes assignee filter parameter", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo", assignee: "42" } } as never);

    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: [42] }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getPullRequests.mockResolvedValue(samplePullRequests);

    await expectStdoutContaining(async () => {
      const { list } = await import("./list");
      await list.run?.({ args: { project: "PROJ", repo: "repo", json: "" } } as never);
    }, "Add feature A");
  });
});
