import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postPullRequestComments: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr comment", () => {
  it("adds a comment to a pull request", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 1, content: "Great work!" });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", body: "Great work!" },
    } as never);

    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("PROJ", "repo", 42, {
      content: "Great work!",
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Added comment to pull request #42");
  });

  it("adds a comment with notified users", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 2, content: "FYI" });

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", body: "FYI", notify: "111,222" },
    } as never);

    expect(mockClient.postPullRequestComments).toHaveBeenCalledWith("PROJ", "repo", 42, {
      content: "FYI",
      notifiedUserId: [111, 222],
    });
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postPullRequestComments.mockResolvedValue({ id: 1, content: "Comment" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { comment } = await import("./comment");
    await comment.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", body: "Comment", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Comment"));
    writeSpy.mockRestore();
  });
});
