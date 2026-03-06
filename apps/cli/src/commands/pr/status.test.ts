import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getMyself: vi.fn(),
  getPullRequests: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
  mockClient.getMyself.mockResolvedValue({ id: 1, name: "Alice" });
};

const samplePullRequests = [
  { number: 1, summary: "Add feature A", status: { id: 1, name: "Open" } },
  { number: 2, summary: "Fix bug B", status: { id: 1, name: "Open" } },
  { number: 3, summary: "Docs update", status: { id: 3, name: "Merged" } },
];

describe("pr status", () => {
  it("displays pull requests grouped by status", async () => {
    setupMocks();
    mockClient.getPullRequests.mockResolvedValue(samplePullRequests);

    const { status } = await import("./status");
    await status.run?.({ args: { project: "PROJ", repo: "repo" } } as never);

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
    setupMocks();
    mockClient.getPullRequests.mockResolvedValue([]);

    const { status } = await import("./status");
    await status.run?.({ args: { project: "PROJ", repo: "repo" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No pull requests assigned to you.");
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    mockClient.getPullRequests.mockResolvedValue(samplePullRequests);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { status } = await import("./status");
    await status.run?.({ args: { project: "PROJ", repo: "repo", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    writeSpy.mockRestore();
  });
});
