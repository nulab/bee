import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  patchPullRequest: vi.fn(),
  getIssue: vi.fn(),
});

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr edit", () => {
  it("updates pull request summary", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "New title" });

    await parseCommand(
      () => import("./edit"),
      ["42", "--project", "PROJ", "--repo", "repo", "--title", "New title"],
    );

    expect(mockClient.patchPullRequest).toHaveBeenCalledWith("PROJ", "repo", 42, {
      summary: "New title",
      description: undefined,
      issueId: undefined,
      assigneeId: undefined,
      comment: undefined,
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Updated pull request #42: New title");
  });

  it("resolves issue key to issue ID", async () => {
    mockClient.getIssue.mockResolvedValue({ id: 789 });
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    await parseCommand(
      () => import("./edit"),
      ["42", "--project", "PROJ", "--repo", "repo", "--issue", "PROJ-123"],
    );

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJ-123");
    expect(mockClient.patchPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      42,
      expect.objectContaining({ issueId: 789 }),
    );
  });

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 99 });
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    await parseCommand(
      () => import("./edit"),
      ["42", "--project", "PROJ", "--repo", "repo", "--assignee", "@me"],
    );

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.patchPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      42,
      expect.objectContaining({ assigneeId: 99 }),
    );
  });

  it("propagates error when @me resolution fails for assignee", async () => {
    mockClient.getMyself.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      parseCommand(
        () => import("./edit"),
        ["42", "--project", "PROJ", "--repo", "repo", "--assignee", "@me"],
      ),
    ).rejects.toThrow("Unauthorized");
  });

  it("does not call getMyself when @me is not used", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    await parseCommand(
      () => import("./edit"),
      ["42", "--project", "PROJ", "--repo", "repo", "--assignee", "123"],
    );

    expect(mockClient.getMyself).not.toHaveBeenCalled();
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./edit"),
      ["42", "--project", "PROJ", "--repo", "repo", "--title", "Title", "--json"],
      "Title",
      () => mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" }),
    ),
  );
});
