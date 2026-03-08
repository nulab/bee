import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getIssuesCount: vi.fn(),
  getMyself: vi.fn().mockResolvedValue({ id: 99 }),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  resolveProjectIds: vi.fn((_: unknown, ids: string[]) => Promise.resolve(ids)),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue count", () => {
  it("outputs issue count", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 42 });

    const { default: count } = await import("./count");
    await count.parseAsync(["--project", "TEST"], { from: "user" });

    expect(mockClient.getIssuesCount).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(42);
  });

  it("passes filter parameters", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 5 });

    const { default: count } = await import("./count");
    await count.parseAsync(["--project", "TEST", "--keyword", "bug"], { from: "user" });

    expect(mockClient.getIssuesCount).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "bug" }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 42 });

    await expectStdoutContaining(async () => {
      const { default: count } = await import("./count");
      await count.parseAsync(["--project", "TEST", "--json"], { from: "user" });
    }, "42");
  });

  it("resolves @me to current user ID for assignee", async () => {
    mockClient.getIssuesCount.mockResolvedValue({ count: 1 });

    const { default: count } = await import("./count");
    await count.parseAsync(["--project", "TEST", "--assignee", "@me"], { from: "user" });

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getIssuesCount).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: [99] }),
    );
  });

  it("throws error for unknown priority name", async () => {
    const { default: count } = await import("./count");
    await expect(
      count.parseAsync(["--project", "TEST", "--priority", "invalid"], { from: "user" }),
    ).rejects.toThrow('Unknown priority "invalid". Valid values: high, normal, low');
  });
});
