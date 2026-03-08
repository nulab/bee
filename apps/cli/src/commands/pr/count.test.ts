import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getPullRequestsCount: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  PR_STATUS_NAMES: ["open", "closed", "merged"],
  PrStatusName: { open: 1, closed: 2, merged: 3 },
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr count", () => {
  it("outputs pull request count", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 10 });
    const { count } = await import("./count");
    await count.run?.({ args: { project: "TEST", repo: "my-repo" } } as never);
    expect(mockClient.getPullRequestsCount).toHaveBeenCalledWith(
      "TEST",
      "my-repo",
      expect.any(Object),
    );
    expect(consola.log).toHaveBeenCalledWith(10);
  });

  it("passes status filter", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 3 });
    const { count } = await import("./count");
    await count.run?.({ args: { project: "TEST", repo: "my-repo", status: "open" } } as never);
    expect(mockClient.getPullRequestsCount).toHaveBeenCalledWith(
      "TEST",
      "my-repo",
      expect.objectContaining({ statusId: [1] }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 10 });
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const { count } = await import("./count");
    await count.run?.({ args: { project: "TEST", repo: "my-repo", json: "" } } as never);
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("10"));
    writeSpy.mockRestore();
  });
});
