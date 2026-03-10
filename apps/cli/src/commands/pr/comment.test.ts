import { printTable, resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  postPullRequestComments: vi.fn(),
  getPullRequestComments: vi.fn(),
  patchPullRequestComments: vi.fn(),
});

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
  printTable: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr comment", () => {
  it("adds a comment to a pull request", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 1, content: "LGTM" });

    await parseCommand(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--body", "LGTM"],
    );

    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      content: "LGTM",
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Added comment to pull request #42");
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.postPullRequestComments.mockResolvedValue({ id: 2, content: "Stdin content" });

    await parseCommand(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--body", ""],
    );

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      content: "Stdin content",
      notifiedUserId: [],
    });
  });

  it("adds a comment with notified users", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 3, content: "FYI" });

    await parseCommand(
      () => import("./comment"),
      [
        "42",
        "--project",
        "TEST",
        "--repo",
        "my-repo",
        "--body",
        "FYI",
        "--notify",
        "111",
        "--notify",
        "222",
      ],
    );

    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      content: "FYI",
      notifiedUserId: [111, 222],
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--body", "LGTM", "--json"],
      "LGTM",
      () => {
        mockClient.postPullRequestComments.mockResolvedValue({ id: 1, content: "LGTM" });
      },
    ),
  );

  it("lists comments with --list flag", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 1, content: "Hello", createdUser: { name: "Alice" }, created: "2025-01-01T00:00:00Z" },
    ]);

    await parseCommand(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--list"],
    );

    expect(mockClient.getPullRequestComments).toHaveBeenCalledWith("TEST", "my-repo", 42, {
      order: "asc",
    });
    expect(printTable).toHaveBeenCalled();
  });

  it("shows message when no comments found with --list", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([]);

    await parseCommand(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--list"],
    );

    expect(consola.info).toHaveBeenCalledWith("No comments found.");
  });

  it("edits last comment with --edit-last flag", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 20, content: "My comment", createdUser: { id: 1 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });
    mockClient.patchPullRequestComments.mockResolvedValue({ id: 20, content: "Updated" });

    await parseCommand(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--edit-last", "--body", "Updated"],
    );

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

    await parseCommand(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--edit-last"],
    );

    expect(consola.error).toHaveBeenCalledWith(
      "Comment body is required. Use --body or pipe input.",
    );
  });

  it("shows error when body is missing for add comment", async () => {
    await parseCommand(() => import("./comment"), ["42", "--project", "TEST", "--repo", "my-repo"]);

    expect(consola.error).toHaveBeenCalledWith(
      "Comment body is required. Use --body or pipe input.",
    );
  });

  it("shows error when no own comment found with --edit-last", async () => {
    mockClient.getPullRequestComments.mockResolvedValue([
      { id: 10, content: "Other", createdUser: { id: 999 } },
    ]);
    mockClient.getMyself.mockResolvedValue({ id: 1 });

    await parseCommand(
      () => import("./comment"),
      ["42", "--project", "TEST", "--repo", "my-repo", "--edit-last", "--body", "Updated"],
    );

    expect(consola.error).toHaveBeenCalledWith("No comment by you was found on pull request #42.");
  });
});
