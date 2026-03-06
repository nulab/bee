import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getPullRequests: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/backlog-utils")>()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

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
    setupMocks();
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
    setupMocks();
    mockClient.getPullRequests.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No pull requests found.");
  });

  it("shows Unassigned for pull requests without assignee", async () => {
    setupMocks();
    mockClient.getPullRequests.mockResolvedValue([samplePullRequests[1]]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo" } } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("passes status filter parameter", async () => {
    setupMocks();
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
    setupMocks();

    const { list } = await import("./list");
    await expect(
      list.run?.({ args: { project: "PROJ", repo: "repo", status: "invalid" } } as never),
    ).rejects.toThrow('Unknown status "invalid"');
  });

  it("passes assignee filter parameter", async () => {
    setupMocks();
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
    setupMocks();
    mockClient.getPullRequests.mockResolvedValue(samplePullRequests);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "PROJ", repo: "repo", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Add feature A"));
    writeSpy.mockRestore();
  });
});
