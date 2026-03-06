import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postPullRequest: vi.fn(),
  getMyself: vi.fn(),
  getIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/backlog-utils")>()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((_label: string, value: string) => Promise.resolve(value)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

describe("pr create", () => {
  it("creates a pull request with required fields", async () => {
    setupMocks();
    mockClient.postPullRequest.mockResolvedValue({ number: 1, summary: "Add feature" });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "PROJ",
        repo: "repo",
        base: "main",
        head: "feature",
        title: "Add feature",
        body: "Details here",
      },
    } as never);

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
  });

  it("creates a pull request with assignee @me", async () => {
    setupMocks();
    mockClient.getMyself.mockResolvedValue({ id: 99 });
    mockClient.postPullRequest.mockResolvedValue({ number: 2, summary: "Title" });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "PROJ",
        repo: "repo",
        base: "main",
        head: "feature",
        title: "Title",
        body: "Desc",
        assignee: "@me",
      },
    } as never);

    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: 99 }),
    );
  });

  it("creates a pull request with related issue", async () => {
    setupMocks();
    mockClient.postPullRequest.mockResolvedValue({ number: 3, summary: "Title" });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "PROJ",
        repo: "repo",
        base: "main",
        head: "feature",
        title: "Title",
        body: "Desc",
        issue: "456",
      },
    } as never);

    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ issueId: 456 }),
    );
  });

  it("resolves issue key to issue ID", async () => {
    setupMocks();
    mockClient.getIssue.mockResolvedValue({ id: 789 });
    mockClient.postPullRequest.mockResolvedValue({ number: 4, summary: "Title" });

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "PROJ",
        repo: "repo",
        base: "main",
        head: "feature",
        title: "Title",
        body: "Desc",
        issue: "PROJ-123",
      },
    } as never);

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJ-123");
    expect(mockClient.postPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ issueId: 789 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    mockClient.postPullRequest.mockResolvedValue({ number: 1, summary: "Add feature" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({
      args: {
        project: "PROJ",
        repo: "repo",
        base: "main",
        head: "feature",
        title: "Add feature",
        body: "Details",
        json: "",
      },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Add feature"));
    writeSpy.mockRestore();
  });
});
