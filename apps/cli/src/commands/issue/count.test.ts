import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getIssuesCount: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
  resolveProjectIds: vi.fn((_: unknown, ids: string[]) => Promise.resolve(ids)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue count", () => {
  it("outputs issue count", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 42 });

    await parseCommand(() => import("./count"), ["--project", "TEST"]);

    expect(mockClient.getIssuesCount).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(42);
  });

  it("passes filter parameters", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 5 });

    await parseCommand(() => import("./count"), ["--project", "TEST", "--keyword", "bug"]);

    expect(mockClient.getIssuesCount).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "bug" }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./count"),
      ["--project", "TEST", "--json"],
      "42",
      () => {
        mockClient.getIssuesCount.mockResolvedValue({ count: 42 });
      },
    ),
  );

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 1 });

    await parseCommand(() => import("./count"), ["--project", "TEST", "--assignee", "@me"]);

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getIssuesCount).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: [99] }),
    );
  });

  it("throws error for unknown priority name", async () => {
    await expect(
      parseCommand(() => import("./count"), ["--project", "TEST", "--priority", "invalid"]),
    ).rejects.toThrow('Unknown priority "invalid". Valid values: high, normal, low');
  });
});
