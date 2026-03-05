import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue edit", () => {
  it("updates issue summary", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "New title" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { issue: "TEST-1", title: "New title" } } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ summary: "New title" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated issue TEST-1: New title");
  });

  it("updates assignee and priority", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { issue: "TEST-1", assignee: "12345", priority: "high" },
    } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ assigneeId: 12_345, priorityId: 2 }),
    );
  });

  it("passes comment with the update", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { issue: "TEST-1", title: "New title", comment: "Updated" },
    } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ summary: "New title", comment: "Updated" }),
    );
  });

  it("passes notifiedUserId and attachmentId to API", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { issue: "TEST-1", title: "Title", notify: "111,222", attachment: "1,2" },
    } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({
        notifiedUserId: [111, 222],
        attachmentId: [1, 2],
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { edit } = await import("./edit");
    await edit.run?.({ args: { issue: "TEST-1", title: "Title", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST-1"));
    writeSpy.mockRestore();
  });
});
