import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ patchIssue: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue edit", () => {
  it("updates issue summary", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "New title" });

    await parseCommand(() => import("./edit"), ["TEST-1", "--title", "New title"]);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ summary: "New title" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated issue TEST-1: New title");
  });

  it("updates assignee and priority", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await parseCommand(
      () => import("./edit"),
      ["TEST-1", "--assignee", "12345", "--priority", "high"],
    );

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ assigneeId: 12_345, priorityId: 2 }),
    );
  });

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await parseCommand(() => import("./edit"), ["TEST-1", "--assignee", "@me"]);

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ assigneeId: 99 }),
    );
  });

  it("passes comment with the update", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await parseCommand(
      () => import("./edit"),
      ["TEST-1", "--title", "New title", "--comment", "Updated"],
    );

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ summary: "New title", comment: "Updated" }),
    );
  });

  it("passes notifiedUserId and attachmentId to API", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await parseCommand(
      () => import("./edit"),
      [
        "TEST-1",
        "--title",
        "Title",
        "--notify",
        "111",
        "--notify",
        "222",
        "--attachment",
        "1",
        "--attachment",
        "2",
      ],
    );

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({
        notifiedUserId: [111, 222],
        attachmentId: [1, 2],
      }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["TEST-1", "--title", "Title", "--json"],
      "TEST-1",
      () => mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" }),
    ),
  );

  it("sends only specified fields in PATCH payload", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "New title" });

    await parseCommand(() => import("./edit"), ["TEST-1", "--title", "New title"]);

    const [issueKey, payload] = mockClient.patchIssue.mock.calls[0];
    expect(issueKey).toBe("TEST-1");
    expect(payload).toEqual({
      summary: "New title",
      description: undefined,
      statusId: undefined,
      priorityId: undefined,
      issueTypeId: undefined,
      assigneeId: undefined,
      resolutionId: undefined,
      parentIssueId: undefined,
      startDate: undefined,
      dueDate: undefined,
      estimatedHours: undefined,
      actualHours: undefined,
      comment: undefined,
      notifiedUserId: [],
      attachmentId: [],
    });
  });

  it("throws error for unknown priority name", async () => {
    const { default: edit } = await import("./edit");
    await expect(
      edit.parseAsync(["TEST-1", "--priority", "invalid"], { from: "user" }),
    ).rejects.toThrow('Unknown priority "invalid". Valid values: high, normal, low');
  });
});
