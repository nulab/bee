import { confirmOrExit, printTable, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postIssueComments: vi.fn(),
  getIssueComments: vi.fn(),
  getMyself: vi.fn(),
  patchIssueComment: vi.fn(),
  deleteIssueComment: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
  confirmOrExit: vi.fn(),
  printTable: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue comment", () => {
  it("adds a comment to an issue", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 1, content: "Hello" });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", body: "Hello" } } as never);

    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "Hello",
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Added comment to TEST-1");
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.postIssueComments.mockResolvedValue({ id: 2, content: "Stdin content" });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", body: "" } } as never);

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "Stdin content",
      notifiedUserId: [],
    });
  });

  it("adds a comment with notified users", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 3, content: "FYI" });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", body: "FYI", notify: "111,222" } } as never);

    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "FYI",
      notifiedUserId: [111, 222],
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 1, content: "Hello" });

    await expectStdoutContaining(async () => {
      const { comment } = await import("./comment");
      await comment.run?.({ args: { issue: "TEST-1", body: "Hello", json: "" } } as never);
    }, "Hello");
  });

  it("lists comments with --list flag", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 1, content: "Hello", createdUser: { name: "Alice" }, created: "2025-01-01T00:00:00Z" },
    ]);

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", list: true } } as never);

    expect(mockClient.getIssueComments).toHaveBeenCalledWith("TEST-1", { order: "asc" });
    expect(printTable).toHaveBeenCalled();
  });

  it("shows message when no comments found with --list", async () => {
    mockClient.getIssueComments.mockResolvedValue([]);

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", list: true } } as never);

    expect(consola.info).toHaveBeenCalledWith("No comments found.");
  });

  it("edits last comment with --edit-last flag", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 10, content: "Other", createdUser: { id: 999 } },
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    mockClient.patchIssueComment.mockResolvedValue({ id: 20, content: "Updated" });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { issue: "TEST-1", "edit-last": true, body: "Updated" },
    } as never);

    expect(mockClient.patchIssueComment).toHaveBeenCalledWith("TEST-1", 20, {
      content: "Updated",
    });
    expect(consola.success).toHaveBeenCalledWith("Updated comment on TEST-1");
  });

  it("shows error when no own comment found with --edit-last", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 10, content: "Other", createdUser: { id: 999 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { issue: "TEST-1", "edit-last": true, body: "Updated" },
    } as never);

    expect(consola.error).toHaveBeenCalledWith("No comment by you was found on TEST-1.");
  });

  it("deletes last comment with --delete-last flag", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssueComment.mockResolvedValue({ id: 20 });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", "delete-last": true } } as never);

    expect(confirmOrExit).toHaveBeenCalled();
    expect(mockClient.deleteIssueComment).toHaveBeenCalledWith("TEST-1", 20);
    expect(consola.success).toHaveBeenCalledWith("Deleted comment on TEST-1");
  });

  it("skips confirmation with --yes flag on delete", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssueComment.mockResolvedValue({ id: 20 });

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", "delete-last": true, yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels delete when user declines", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { comment } = await import("./comment");
    await comment.run?.({ args: { issue: "TEST-1", "delete-last": true } } as never);

    expect(mockClient.deleteIssueComment).not.toHaveBeenCalled();
  });
});
