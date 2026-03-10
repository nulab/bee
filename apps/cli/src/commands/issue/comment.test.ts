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

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--body", "Hello"], { from: "user" });

    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "Hello",
      notifiedUserId: [],
      attachmentId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Added comment to TEST-1");
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.postIssueComments.mockResolvedValue({ id: 2, content: "Stdin content" });

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--body", ""], { from: "user" });

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "Stdin content",
      notifiedUserId: [],
      attachmentId: [],
    });
  });

  it("adds a comment with notified users", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 3, content: "FYI" });

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--body", "FYI", "--notify", "111", "--notify", "222"], {
      from: "user",
    });

    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "FYI",
      notifiedUserId: [111, 222],
      attachmentId: [],
    });
  });

  it("adds a comment with attachments", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 4, content: "See attached" });

    const { default: comment } = await import("./comment");
    await comment.parseAsync(
      ["TEST-1", "--body", "See attached", "--attachment", "1", "--attachment", "2"],
      { from: "user" },
    );

    expect(mockClient.postIssueComments).toHaveBeenCalledWith("TEST-1", {
      content: "See attached",
      notifiedUserId: [],
      attachmentId: [1, 2],
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postIssueComments.mockResolvedValue({ id: 1, content: "Hello" });

    await expectStdoutContaining(async () => {
      const { default: comment } = await import("./comment");
      await comment.parseAsync(["TEST-1", "--body", "Hello", "--json"], { from: "user" });
    }, "Hello");
  });

  it("lists comments with --list flag", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 1, content: "Hello", createdUser: { name: "Alice" }, created: "2025-01-01T00:00:00Z" },
    ]);

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--list"], { from: "user" });

    expect(mockClient.getIssueComments).toHaveBeenCalledWith("TEST-1", { order: "asc" });
    expect(printTable).toHaveBeenCalled();
  });

  it("shows message when no comments found with --list", async () => {
    mockClient.getIssueComments.mockResolvedValue([]);

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--list"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No comments found.");
  });

  it("edits last comment with --edit-last flag", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 10, content: "Other", createdUser: { id: 999 } },
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    mockClient.patchIssueComment.mockResolvedValue({ id: 20, content: "Updated" });

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--edit-last", "--body", "Updated"], { from: "user" });

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

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--edit-last", "--body", "Updated"], { from: "user" });

    expect(consola.error).toHaveBeenCalledWith("No comment by you was found on TEST-1.");
  });

  it("deletes last comment with --delete-last flag", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssueComment.mockResolvedValue({ id: 20 });

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--delete-last"], { from: "user" });

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

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--delete-last", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete your comment on TEST-1?",
      true,
    );
  });

  it("cancels delete when user declines", async () => {
    mockClient.getIssueComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--delete-last"], { from: "user" });

    expect(mockClient.deleteIssueComment).not.toHaveBeenCalled();
  });

  it("shows error when body is missing for add comment", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce(undefined);

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1"], { from: "user" });

    expect(consola.error).toHaveBeenCalledWith(
      "Comment body is required. Use --body or pipe input.",
    );
    expect(mockClient.postIssueComments).not.toHaveBeenCalled();
  });

  it("shows error when body is missing with --edit-last", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    mockClient.getIssueComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    vi.mocked(resolveStdinArg).mockResolvedValueOnce(undefined);

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--edit-last"], { from: "user" });

    expect(consola.error).toHaveBeenCalledWith(
      "Comment body is required. Use --body or pipe input.",
    );
    expect(mockClient.patchIssueComment).not.toHaveBeenCalled();
  });

  it("shows error when no own comment found with --delete-last", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    mockClient.getIssueComments.mockResolvedValue([
      { id: 10, content: "Other", createdUser: { id: 999 } },
    ]);

    const { default: comment } = await import("./comment");
    await comment.parseAsync(["TEST-1", "--delete-last"], { from: "user" });

    expect(consola.error).toHaveBeenCalledWith("No comment by you was found on TEST-1.");
    expect(mockClient.deleteIssueComment).not.toHaveBeenCalled();
  });
});
