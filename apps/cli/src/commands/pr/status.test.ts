import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getMyself: vi.fn(),
  getPullRequests: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const samplePullRequests = [
  { number: 1, summary: "Add feature A", status: { id: 1, name: "Open" } },
  { number: 2, summary: "Fix bug B", status: { id: 1, name: "Open" } },
  { number: 3, summary: "Docs update", status: { id: 3, name: "Merged" } },
];

describe("pr status", () => {
  it("displays pull requests grouped by status", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 1, name: "Alice" });
    mockClient.getPullRequests.mockResolvedValue(samplePullRequests);

    const { default: status } = await import("./status");
    await status.parseAsync(["--project", "PROJ", "--repo", "repo"], { from: "user" });

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getPullRequests).toHaveBeenCalledWith(
      "PROJ",
      "repo",
      expect.objectContaining({ assigneeId: [1] }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open (2)"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Merged (1)"));
  });

  it("shows message when no pull requests assigned", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 1, name: "Alice" });
    mockClient.getPullRequests.mockResolvedValue([]);

    const { default: status } = await import("./status");
    await status.parseAsync(["--project", "PROJ", "--repo", "repo"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No pull requests assigned to you.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 1, name: "Alice" });
    mockClient.getPullRequests.mockResolvedValue(samplePullRequests);

    await expectStdoutContaining(async () => {
      const { default: status } = await import("./status");
      await status.parseAsync(["--project", "PROJ", "--repo", "repo", "--json"], { from: "user" });
    }, "Alice");
  });
});
