import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getPullRequestsCount: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("pr count", () => {
  it("outputs pull request count", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 10 });

    await parseCommand(() => import("./count"), ["--project", "TEST", "--repo", "my-repo"]);

    expect(mockClient.getPullRequestsCount).toHaveBeenCalledWith(
      "TEST",
      "my-repo",
      expect.any(Object),
    );
    expect(consola.log).toHaveBeenCalledWith(10);
  });

  it("passes status filter", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 3 });

    await parseCommand(
      () => import("./count"),
      ["--project", "TEST", "--repo", "my-repo", "--status", "open"],
    );

    expect(mockClient.getPullRequestsCount).toHaveBeenCalledWith(
      "TEST",
      "my-repo",
      expect.objectContaining({ statusId: [1] }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./count"),
      ["--project", "TEST", "--repo", "my-repo", "--json"],
      "10",
      () => {
        mockClient.getPullRequestsCount.mockResolvedValue({ count: 10 });
      },
    ),
  );

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.getPullRequestsCount.mockResolvedValue({ count: 5 });

    await parseCommand(
      () => import("./count"),
      ["--project", "TEST", "--repo", "my-repo", "--assignee", "@me"],
    );

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getPullRequestsCount).toHaveBeenCalledWith(
      "TEST",
      "my-repo",
      expect.objectContaining({ assigneeId: [99] }),
    );
  });

  it("throws error for unknown status name", async () => {
    await expect(
      parseCommand(
        () => import("./count"),
        ["--project", "TEST", "--repo", "my-repo", "--status", "invalid"],
      ),
    ).rejects.toThrow('Unknown status "invalid". Valid values: open, closed, merged');
  });
});
