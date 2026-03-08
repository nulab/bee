import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getIssues: vi.fn(),
  getProjects: vi.fn().mockResolvedValue([{ id: 123, projectKey: "PROJ" }]),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
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

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getIssues).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("KEY"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-2"));
  });

  it("shows message when no issues found", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No issues found.");
  });

  it("shows Unassigned for issues without assignee", async () => {
    mockClient.getIssues.mockResolvedValue([sampleIssues[1]]);

    const { list } = await import("./list");
    await list.run?.({ args: {} } as never);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unassigned"));
  });

  it("passes project query parameter", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { project: "123" } } as never);

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: [123] }),
    );
  });

  it("passes assignee query parameter", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { assignee: "42" } } as never);

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: [42] }),
    );
  });

  it("passes keyword query parameter", async () => {
    mockClient.getIssues.mockResolvedValue([]);

    const { list } = await import("./list");
    await list.run?.({ args: { keyword: "login bug" } } as never);

    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "login bug" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getIssues.mockResolvedValue(sampleIssues);

    await expectStdoutContaining(async () => {
      const { list } = await import("./list");
      await list.run?.({ args: { json: "" } } as never);
    }, "PROJ-1");
  });

  it("propagates API errors", async () => {
    mockClient.getIssues.mockRejectedValue(new Error("API error"));

    const { list } = await import("./list");
    await expect(list.run?.({ args: {} } as never)).rejects.toThrow("API error");
  });
});
