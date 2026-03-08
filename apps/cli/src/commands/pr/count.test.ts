import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getPullRequestsCount: vi.fn(),
  getMyself: vi.fn().mockResolvedValue({ id: 99 }),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr count", () => {
  it("outputs pull request count", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 10 });
    const { default: count } = await import("./count");
    await count.parseAsync(["--project", "TEST", "--repo", "my-repo"], { from: "user" });
    expect(mockClient.getPullRequestsCount).toHaveBeenCalledWith(
      "TEST",
      "my-repo",
      expect.any(Object),
    );
    expect(consola.log).toHaveBeenCalledWith(10);
  });

  it("passes status filter", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 3 });
    const { default: count } = await import("./count");
    await count.parseAsync(["--project", "TEST", "--repo", "my-repo", "--status", "open"], {
      from: "user",
    });
    expect(mockClient.getPullRequestsCount).toHaveBeenCalledWith(
      "TEST",
      "my-repo",
      expect.objectContaining({ statusId: [1] }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 10 });
    await expectStdoutContaining(async () => {
      const { default: count } = await import("./count");
      await count.parseAsync(["--project", "TEST", "--repo", "my-repo", "--json"], {
        from: "user",
      });
    }, "10");
  });

  it("throws error for unknown status name", async () => {
    const { default: count } = await import("./count");
    await expect(
      count.parseAsync(["--project", "TEST", "--repo", "my-repo", "--status", "invalid"], {
        from: "user",
      }),
    ).rejects.toThrow('Unknown status "invalid". Valid values: open, closed, merged');
  });
});
