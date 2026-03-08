import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getIssuesCount: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  resolveProjectIds: vi.fn((_: unknown, ids: string[]) => Promise.resolve(ids)),
  PRIORITY_NAMES: ["high", "normal", "low"],
  PriorityId: { high: 2, normal: 3, low: 4 },
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue count", () => {
  it("outputs issue count", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 42 });

    const { count } = await import("./count");
    await count.run?.({ args: { project: "TEST" } } as never);

    expect(mockClient.getIssuesCount).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(42);
  });

  it("passes filter parameters", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 5 });

    const { count } = await import("./count");
    await count.run?.({ args: { project: "TEST", keyword: "bug" } } as never);

    expect(mockClient.getIssuesCount).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "bug" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 42 });

    await expectStdoutContaining(async () => {
      const { count } = await import("./count");
      await count.run?.({ args: { project: "TEST", json: "" } } as never);
    }, "42");
  });

  it("throws error for unknown priority name", async () => {
    const { count } = await import("./count");
    await expect(
      count.run?.({
        args: { project: "TEST", priority: "invalid" },
      } as never),
    ).rejects.toThrow('Unknown priority "invalid". Valid values: high, normal, low');
  });
});
