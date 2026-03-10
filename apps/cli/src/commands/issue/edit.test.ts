import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchIssue: vi.fn(),
  getMyself: vi.fn().mockResolvedValue({ id: 99 }),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue edit", () => {
  it("updates issue summary", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "New title" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["TEST-1", "--title", "New title"], { from: "user" });

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ summary: "New title" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated issue TEST-1: New title");
  });

  it("updates assignee and priority", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["TEST-1", "--assignee", "12345", "--priority", "high"], {
      from: "user",
    });

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ assigneeId: 12_345, priorityId: 2 }),
    );
  });

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["TEST-1", "--assignee", "@me"], { from: "user" });

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ assigneeId: 99 }),
    );
  });

  it("passes comment with the update", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["TEST-1", "--title", "New title", "--comment", "Updated"], {
      from: "user",
    });

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ summary: "New title", comment: "Updated" }),
    );
  });

  it("passes notifiedUserId and attachmentId to API", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(
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
      { from: "user" },
    );

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({
        notifiedUserId: [111, 222],
        attachmentId: [1, 2],
      }),
    );
  });

  it("passes categoryId, versionId, and milestoneId to API", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(
      [
        "TEST-1",
        "--title",
        "Title",
        "--category",
        "10",
        "--category",
        "20",
        "--version",
        "30",
        "--milestone",
        "40",
        "--milestone",
        "50",
      ],
      { from: "user" },
    );

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({
        categoryId: [10, 20],
        versionId: [30],
        milestoneId: [40, 50],
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await expectStdoutContaining(async () => {
      const { default: edit } = await import("./edit");
      await edit.parseAsync(["TEST-1", "--title", "Title", "--json"], { from: "user" });
    }, "TEST-1");
  });

  it("throws error for unknown priority name", async () => {
    const { default: edit } = await import("./edit");
    await expect(
      edit.parseAsync(["TEST-1", "--priority", "invalid"], { from: "user" }),
    ).rejects.toThrow('Unknown priority "invalid". Valid values: high, normal, low');
  });
});
