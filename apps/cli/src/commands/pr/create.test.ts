import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postPullRequest: vi.fn(),
  getMyself: vi.fn(),
  getIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, value: string) => Promise.resolve(value)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr create", () => {
  it("creates a pull request with required fields", async () => {
    mockClient.postPullRequest.mockResolvedValue({ number: 1, summary: "Add feature" });

    const { default: create } = await import("./create");
    await create.parseAsync(
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
      { from: "user" },
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

    const { default: create } = await import("./create");
    await create.parseAsync(
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
      { from: "user" },
    );

    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: 99 }),
    );
  });

  it("creates a pull request with related issue", async () => {
    mockClient.postPullRequest.mockResolvedValue({ number: 3, summary: "Title" });

    const { default: create } = await import("./create");
    await create.parseAsync(
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
      { from: "user" },
    );

    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ issueId: 456 }),
    );
  });

  it("resolves issue key to issue ID", async () => {
    mockClient.getIssue.mockResolvedValue({ id: 789 });
    mockClient.postPullRequest.mockResolvedValue({ number: 4, summary: "Title" });

    const { default: create } = await import("./create");
    await create.parseAsync(
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
      { from: "user" },
    );

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJ-123");
    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ issueId: 789 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postPullRequest.mockResolvedValue({ number: 1, summary: "Add feature" });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(
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
        { from: "user" },
      );
    }, "Add feature");
  });
});
