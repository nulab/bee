import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchPullRequest: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr reopen", () => {
  it("reopens a pull request", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const { reopen } = await import("./reopen");
    await reopen.run?.({
      args: { number: "42", project: "PROJ", repo: "repo" },
    } as never);

    expect(mockClient.patchPullRequest).toHaveBeenCalledWith("PROJ", "repo", 42, {
      statusId: 1,
      comment: undefined,
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Reopened pull request #42: Title");
  });

  it("reopens a pull request with a comment", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const { reopen } = await import("./reopen");
    await reopen.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", comment: "Need more review" },
    } as never);

    expect(mockClient.patchPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      42,
      expect.objectContaining({ comment: ["Need more review"] }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { reopen } = await import("./reopen");
    await reopen.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Title"));
    writeSpy.mockRestore();
  });
});
