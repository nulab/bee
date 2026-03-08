import { printTable, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postPullRequestComments: vi.fn(),
  getPullRequestComments: vi.fn(),
  getMyself: vi.fn(),
  patchPullRequestComments: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
  printTable: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr comment", () => {
  it("adds a comment to a pull request", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 1, content: "LGTM" });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "TEST", repo: "my-repo", body: "LGTM" },
    } as never);

    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      content: "LGTM",
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Added comment to pull request #42");
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.postPullRequestComments.mockResolvedValue({ id: 2, content: "Stdin content" });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "TEST", repo: "my-repo", body: "" },
    } as never);

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      content: "Stdin content",
      notifiedUserId: [],
    });
  });

  it("adds a comment with notified users", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 3, content: "FYI" });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "TEST", repo: "my-repo", body: "FYI", notify: "111,222" },
    } as never);

    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      content: "FYI",
      notifiedUserId: [111, 222],
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 1, content: "LGTM" });
    await expectStdoutContaining(async () => {
      const { comment } = await import("./comment");
      await comment.run?.({
        args: { number: "42", project: "TEST", repo: "my-repo", body: "LGTM", json: "" },
      } as never);
    }, "LGTM");
  });

  it("lists comments with --list flag", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 1, content: "Hello", createdUser: { name: "Alice" }, created: "2025-01-01T00:00:00Z" },
    ]);

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "TEST", repo: "my-repo", list: true },
    } as never);

    expect(mockClient.getPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      order: "asc",
    });
    expect(printTable).toHaveBeenCalled();
  });

  it("shows message when no comments found with --list", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([]);

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "TEST", repo: "my-repo", list: true },
    } as never);

    expect(consola.info).toHaveBeenCalledWith("No comments found.");
  });

  it("edits last comment with --edit-last flag", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    mockClient.patchPullRequestComments.mockResolvedValue({ id: 20, content: "Updated" });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: {
        number: "42",
        project: "TEST",
        repo: "my-repo",
        "edit-last": true,
        body: "Updated",
      },
    } as never);

    expect(mockClient.patchPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, 20, {
      content: "Updated",
    });
    expect(consola.success).toHaveBeenCalledWith("Updated comment on pull request #42");
  });

  it("shows error when body is missing with --edit-last", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: {
        number: "42",
        project: "TEST",
        repo: "my-repo",
        "edit-last": true,
      },
    } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "Comment body is required. Use --body or pipe input.",
    );
  });

  it("shows error when body is missing for add comment", async () => {
    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "TEST", repo: "my-repo" },
    } as never);

    expect(consola.error).toHaveBeenCalledWith(
      "Comment body is required. Use --body or pipe input.",
    );
  });

  it("shows error when no own comment found with --edit-last", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 10, content: "Other", createdUser: { id: 999 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: {
        number: "42",
        project: "TEST",
        repo: "my-repo",
        "edit-last": true,
        body: "Updated",
      },
    } as never);

    expect(consola.error).toHaveBeenCalledWith("No comment by you was found on pull request #42.");
  });
});
