import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, parseCommand } from "@repo/test-utils";

const mockClient = vi.hoisted(() => ({
  getIssue: vi.fn(),
  getIssueComments: vi.fn(),
}));

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
  issueUrl: vi.fn((host: string, key: string) => `https://${host}/view/${key}`),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleIssue = {
  id: 1,
  issueKey: "PROJ-1",
  summary: "Test issue",
  description: "A test description",
  status: { name: "Open" },
  issueType: { name: "Bug" },
  priority: { name: "High" },
  assignee: { name: "Alice" },
  createdUser: { name: "Bob" },
  created: "2025-01-01T00:00:00Z",
  updated: "2025-01-02T00:00:00Z",
  startDate: null,
  dueDate: null,
  estimatedHours: null,
  actualHours: null,
  category: [],
  milestone: [],
  version: [],
};

describe("issue view", () => {
  it("displays issue details", async () => {
    mockClient.getIssue.mockResolvedValue(sampleIssue);

    await parseCommand(() => import("./view"), ["PROJ-1"]);

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJ-1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test issue"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("High"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
  });

  it("shows Unassigned for issues without assignee", async () => {
    mockClient.getIssue.mockResolvedValue({ ...sampleIssue, assignee: null });

    await parseCommand(() => import("./view"), ["PROJ-1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("displays description when present", async () => {
    mockClient.getIssue.mockResolvedValue(sampleIssue);

    await parseCommand(() => import("./view"), ["PROJ-1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Description"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("A test description"));
  });

  it("fetches and displays comments with --comments flag", async () => {
    mockClient.getIssue.mockResolvedValue(sampleIssue);
    mockClient.getIssueComments.mockResolvedValue([
      {
        content: "A comment",
        createdUser: { name: "Charlie" },
        created: "2025-01-03T00:00:00Z",
      },
    ]);

    await parseCommand(() => import("./view"), ["PROJ-1", "--comments"]);

    expect(mockClient.getIssueComments).toHaveBeenCalledWith("PROJ-1", { order: "asc" });
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Comments"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Charlie"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("A comment"));
  });

  it("opens browser with --web flag", async () => {
    await parseCommand(() => import("./view"), ["PROJ-1", "--web"]);

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/view/PROJ-1",
      false,
      consola,
    );
    expect(mockClient.getIssue).not.toHaveBeenCalled();
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./view"),
      ["PROJ-1", "--json"],
      "PROJ-1",
      () => {
        mockClient.getIssue.mockResolvedValue(sampleIssue);
      },
    ),
  );
});
