import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({
  postPullRequest: vi.fn(),
  getIssue: vi.fn(),
});

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, val?: string) => Promise.resolve(val)),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr create", () => {
  it("creates a pull request with required fields", async () => {
    mockClient.postPullRequest.mockResolvedValue({ number: 1, summary: "Add feature" });

    await parseCommand(
      () => import("./create"),
      [
        "--project",
        "PROJ",
        "--repo",
        "repo",
        "--base",
        "main",
        "--head",
        "feature",
        "--title",
        "Add feature",
        "--body",
        "Details here",
      ],
    );

    expect(mockClient.postPullRequest).toHaveBeenCalledWith("PROJ", "repo", {
      summary: "Add feature",
      description: "Details here",
      base: "main",
      branch: "feature",
      issueId: undefined,
      assigneeId: undefined,
      notifiedUserId: [],
      attachmentId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Created pull request #1: Add feature");
    expect(consola.info).toHaveBeenCalledWith(
      "https://example.backlog.com/git/PROJ/repo/pullRequests/1",
    );
  });

  it("creates a pull request with assignee @me", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 99 });
    mockClient.postPullRequest.mockResolvedValue({ number: 2, summary: "Title" });

    await parseCommand(
      () => import("./create"),
      [
        "--project",
        "PROJ",
        "--repo",
        "repo",
        "--base",
        "main",
        "--head",
        "feature",
        "--title",
        "Title",
        "--body",
        "Desc",
        "--assignee",
        "@me",
      ],
    );

    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: 99 }),
    );
  });

  it("uses numeric issue ID directly without resolution", async () => {
    mockClient.postPullRequest.mockResolvedValue({ number: 3, summary: "Title" });

    await parseCommand(
      () => import("./create"),
      [
        "--project",
        "PROJ",
        "--repo",
        "repo",
        "--base",
        "main",
        "--head",
        "feature",
        "--title",
        "Title",
        "--body",
        "Desc",
        "--issue",
        "456",
      ],
    );

    expect(mockClient.getIssue).not.toHaveBeenCalled();
    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ issueId: 456 }),
    );
  });

  it("resolves issue key to issue ID", async () => {
    mockClient.getIssue.mockResolvedValue({ id: 789 });
    mockClient.postPullRequest.mockResolvedValue({ number: 4, summary: "Title" });

    await parseCommand(
      () => import("./create"),
      [
        "--project",
        "PROJ",
        "--repo",
        "repo",
        "--base",
        "main",
        "--head",
        "feature",
        "--title",
        "Title",
        "--body",
        "Desc",
        "--issue",
        "PROJ-123",
      ],
    );

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJ-123");
    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ issueId: 789 }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./create"),
      [
        "--project",
        "PROJ",
        "--repo",
        "repo",
        "--base",
        "main",
        "--head",
        "feature",
        "--title",
        "Add feature",
        "--body",
        "Details",
        "--json",
      ],
      "Add feature",
      () => {
        mockClient.postPullRequest.mockResolvedValue({ number: 1, summary: "Add feature" });
      },
    ),
  );
});
