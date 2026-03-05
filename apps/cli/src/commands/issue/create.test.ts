import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue create", () => {
  it("creates an issue with provided fields", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Fix bug")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("3");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-1",
      summary: "Fix bug",
    });

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "100", title: "Fix bug", type: "1", priority: "3" },
    } as never);

    expect(mockClient.postIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 100,
        summary: "Fix bug",
        issueTypeId: 1,
        priorityId: 3,
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Created issue TEST-1: Fix bug");
  });

  it("prompts for required fields when not provided", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Title")
      .mockResolvedValueOnce("2")
      .mockResolvedValueOnce("3");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-2",
      summary: "Title",
    });

    const { create } = await import("./create");
    await create.run?.({ args: {} } as never);

    expect(promptRequired).toHaveBeenCalledWith("Project:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Summary:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Issue type ID:", undefined);
    expect(promptRequired).toHaveBeenCalledWith("Priority ID:", undefined);
  });

  it("passes optional fields to API", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Title")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("3");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-3",
      summary: "Title",
    });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "100",
        title: "Title",
        type: "1",
        priority: "3",
        description: "Details",
        assignee: "12345",
        "due-date": "2025-12-31",
      },
    } as never);

    expect(mockClient.postIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Details",
        assigneeId: 12_345,
        dueDate: "2025-12-31",
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired)
      .mockResolvedValueOnce("100")
      .mockResolvedValueOnce("Title")
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("3");
    mockClient.postIssue.mockResolvedValue({
      issueKey: "TEST-4",
      summary: "Title",
    });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({
      args: { project: "100", title: "Title", type: "1", priority: "3", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST-4"));
    writeSpy.mockRestore();
  });
});
