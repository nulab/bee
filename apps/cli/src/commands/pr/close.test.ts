import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchPullRequest: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr close", () => {
  it("closes a pull request", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const { close } = await import("./close");
    await close.run?.({
      args: { number: "42", project: "PROJ", repo: "repo" },
    } as never);

    expect(mockClient.patchPullRequest).toHaveBeenCalledWith("PROJ", "repo", 42, {
      statusId: 2,
      comment: undefined,
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Closed pull request #42: Title");
  });

  it("closes a pull request with a comment", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const { close } = await import("./close");
    await close.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", comment: "No longer needed" },
    } as never);

    expect(mockClient.patchPullRequest).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      42,
      expect.objectContaining({ comment: ["No longer needed"] }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchPullRequest.mockResolvedValue({ number: 42, summary: "Title" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { close } = await import("./close");
    await close.run?.({
      args: { number: "42", project: "PROJ", repo: "repo", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Title"));
    writeSpy.mockRestore();
  });
});
