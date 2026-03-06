import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchPullRequest: vi.fn(),
  getIssue: vi.fn(),
  getMyself: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/backlog-utils")>()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

describe("pr edit", () => {
  it("updates pull request summary", async () => {
    setupMocks();
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "New title" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", title: "New title" },
    } as never);

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

  it("updates pull request with a comment", async () => {
    setupMocks();
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: {
        number: "42",
        project: "PROJ",
        repo: "repo",
        title: "Title",
        comment: "Updated",
      },
    } as never);

    expect(mockClient.patchPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      42,
      expect.objectContaining({ comment: "Updated" }),
    );
  });

  it("updates pull request with notified users", async () => {
    setupMocks();
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", notify: "111,222" },
    } as never);

    expect(mockClient.patchPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      42,
      expect.objectContaining({ notifiedUserId: [111, 222] }),
    );
  });

  it("resolves issue key to issue ID", async () => {
    setupMocks();
    mockClient.getIssue.mockResolvedValue({ id: 789 });
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", issue: "PROJ-123" },
    } as never);

    expect(mockClient.getIssue).toHaveBeenCalledWith("PROJ-123");
    expect(mockClient.patchPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      42,
      expect.objectContaining({ issueId: 789 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { edit } = await import("./edit");
    await edit.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", title: "Title", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Title"));
    writeSpy.mockRestore();
  });
});
