import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getIssues: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleIssues = [
  {
    issueKey: "PROJ-1",
    summary: "First issue",
    status: { name: "Open" },
    issueType: { name: "Bug" },
    priority: { name: "High" },
    assignee: { name: "Alice" },
  },
  {
    issueKey: "PROJ-2",
    summary: "Second issue",
    status: { name: "In Progress" },
    issueType: { name: "Task" },
    priority: { name: "Normal" },
    assignee: null,
  },
];

describe("issue list", () => {
  it("displays issue list in tabular format", async () => {
    mockClient.getIssues.mockResolvedValue(sampleIssues);

    await parseCommand(() => import("./list"), []);

    expect(mockClient.getIssues).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("KEY"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-2"));
  });

  it("shows message when no issues found", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(() => import("./list"), []);

    expect(consola.info).toHaveBeenCalledWith("No issues found.");
  });

  it("shows Unassigned for issues without assignee", async () => {
    mockClient.getIssues.mockResolvedValue([sampleIssues[1]]);

    await parseCommand(() => import("./list"), []);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--assignee", "@me"]);

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: [99] }),
    );
  });

  it("sends exact default query parameters (no extra fields)", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(() => import("./list"), []);

    const [[callArgs]] = mockClient.getIssues.mock.calls;
    expect(callArgs).toEqual({
      projectId: [],
      assigneeId: [],
      statusId: [],
      priorityId: [],
      issueTypeId: [],
      categoryId: [],
      versionId: [],
      milestoneId: [],
      resolutionId: [],
      parentIssueId: [],
      keyword: undefined,
      sort: undefined,
      order: undefined,
      count: undefined,
      offset: undefined,
      createdSince: undefined,
      createdUntil: undefined,
      updatedSince: undefined,
      updatedUntil: undefined,
      startDateSince: undefined,
      startDateUntil: undefined,
      dueDateSince: undefined,
      dueDateUntil: undefined,
    });
  });

  it("combines multiple priority filters", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--priority", "high", "--priority", "low"]);

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({ priorityId: [2, 4] }),
    );
  });

  it("passes issue type filter", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--type", "1", "--type", "2"]);

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({ issueTypeId: [1, 2] }),
    );
  });

  it("passes category, version, and milestone filters", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--category", "10", "--version", "20", "--milestone", "30", "--milestone", "31"],
    );

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: [10],
        versionId: [20],
        milestoneId: [30, 31],
      }),
    );
  });

  it("passes resolution and parent issue filters", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(() => import("./list"), ["--resolution", "0", "--parent-issue", "100"]);

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        resolutionId: [0],
        parentIssueId: [100],
      }),
    );
  });

  it("passes start date range filters", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--start-since", "2026-01-01", "--start-until", "2026-12-31"],
    );

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        startDateSince: "2026-01-01",
        startDateUntil: "2026-12-31",
      }),
    );
  });

  it("handles issue with null priority gracefully", async () => {
    mockClient.getIssues.mockResolvedValue([
      {
        issueKey: "PROJ-1",
        summary: "Issue with no priority",
        status: { name: "Open" },
        issueType: { name: "Bug" },
        priority: null,
        assignee: { name: "Alice" },
      },
    ]);

    await parseCommand(() => import("./list"), []);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
  });

  it("handles issue with null issueType gracefully", async () => {
    mockClient.getIssues.mockResolvedValue([
      {
        issueKey: "PROJ-1",
        summary: "Issue with no type",
        status: { name: "Open" },
        issueType: null,
        priority: { name: "Normal" },
        assignee: null,
      },
    ]);

    await parseCommand(() => import("./list"), []);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--json"],
      "PROJ-1",
      () => {
        mockClient.getIssues.mockResolvedValue(sampleIssues);
      },
    ),
  );
});
