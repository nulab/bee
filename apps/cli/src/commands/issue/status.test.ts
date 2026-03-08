import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getMyself: vi.fn(),
  getIssues: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleUser = {
  id: 100,
  name: "Alice",
};

describe("issue status", () => {
  it("displays issues grouped by status", async () => {
    mockClient.getMyself.mockResolvedValue(sampleUser);
    mockClient.getIssues.mockResolvedValue([
      { issueKey: "PROJ-1", summary: "Open issue", status: { name: "Open" } },
      { issueKey: "PROJ-2", summary: "Another open", status: { name: "Open" } },
      { issueKey: "PROJ-3", summary: "In progress", status: { name: "In Progress" } },
    ]);

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeId: [100],
        count: 100,
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open (2)"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("In Progress (1)"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-3"));
  });

  it("shows message when no issues assigned", async () => {
    mockClient.getMyself.mockResolvedValue(sampleUser);
    mockClient.getIssues.mockResolvedValue([]);

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No issues assigned to you.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue(sampleUser);
    mockClient.getIssues.mockResolvedValue([
      { issueKey: "PROJ-1", summary: "Test", status: { name: "Open" } },
    ]);

    await expectStdoutContaining(async () => {
      const { status } = await import("./status");
      await status.run?.({ args: { json: "" } } as never);
    }, "PROJ-1");
  });
});
