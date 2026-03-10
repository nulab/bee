import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getPullRequests: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
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

    await parseCommand(() => import("./list"), ["--project", "PROJ", "--repo", "repo"]);

    expect(mockClient.getPullRequests).toHaveBeenCalledWith("PROJ", "repo", expect.any(Object));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Add feature A"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix bug B"));
  });

  it("shows message when no pull requests found", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--project", "PROJ", "--repo", "repo"]);

    expect(consola.info).toHaveBeenCalledWith("No pull requests found.");
  });

  it("shows Unassigned for pull requests without assignee", async () => {
    mockClient.getPullRequests.mockResolvedValue([samplePullRequests[1]]);

    await parseCommand(() => import("./list"), ["--project", "PROJ", "--repo", "repo"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("passes status filter parameter", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--project", "PROJ", "--repo", "repo", "--status", "open"],
    );

    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ statusId: [1] }),
    );
  });

  it("throws error for unknown status name", async () => {
    const { default: list } = await import("./list");
    await expect(
      list.parseAsync(["--project", "PROJ", "--repo", "repo", "--status", "invalid"], {
        from: "user",
      }),
    ).rejects.toThrow('Unknown status "invalid"');
  });

  it("passes assignee filter parameter", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--project", "PROJ", "--repo", "repo", "--assignee", "42"],
    );

    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: [42] }),
    );
  });

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--project", "PROJ", "--repo", "repo", "--assignee", "@me"],
    );

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: [99] }),
    );
  });

  it("sends exact default query parameters (no extra fields)", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--project", "PROJ", "--repo", "repo"]);

    const callArgs = mockClient.getPullRequests.mock.calls[0];
    expect(callArgs[0]).toBe("PROJ");
    expect(callArgs[1]).toBe("repo");
    expect(callArgs[2]).toEqual({
      statusId: undefined,
      assigneeId: undefined,
      issueId: undefined,
      createdUserId: undefined,
      count: undefined,
      offset: undefined,
    });
  });

  it("combines multiple status filters", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--project", "PROJ", "--repo", "repo", "--status", "open", "--status", "closed"],
    );

    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ statusId: [1, 2] }),
    );
  });

  it("combines multiple assignee filters", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--project", "PROJ", "--repo", "repo", "--assignee", "10", "--assignee", "20"],
    );

    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: [10, 20] }),
    );
  });

  it("combines multiple issue filters", async () => {
    mockClient.getPullRequests.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--project", "PROJ", "--repo", "repo", "--issue", "1", "--issue", "2"],
    );

    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ issueId: [1, 2] }),
    );
  });

  it("handles pull request with null status gracefully", async () => {
    mockClient.getPullRequests.mockResolvedValue([
      {
        number: 1,
        summary: "PR with no status",
        status: null,
        assignee: { name: "Alice" },
      },
    ]);

    await parseCommand(() => import("./list"), ["--project", "PROJ", "--repo", "repo"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PR with no status"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--project", "PROJ", "--repo", "repo", "--json"],
      "Add feature A",
      () => mockClient.getPullRequests.mockResolvedValue(samplePullRequests),
    ),
  );
});
