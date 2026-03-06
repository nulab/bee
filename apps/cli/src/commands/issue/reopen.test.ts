import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/backlog-utils")>()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue reopen", () => {
  it("reopens an issue", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { reopen } = await import("./reopen");
    await reopen.run?.({ args: { issue: "TEST-1" } } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith("TEST-1", {
      statusId: 1,
      comment: undefined,
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Reopened issue TEST-1: Title");
  });

  it("reopens an issue with a comment", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { reopen } = await import("./reopen");
    await reopen.run?.({ args: { issue: "TEST-1", comment: "Regression found" } } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ comment: "Regression found" }),
    );
  });

  it("reopens an issue with notified users", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { reopen } = await import("./reopen");
    await reopen.run?.({ args: { issue: "TEST-1", notify: "111,222" } } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ notifiedUserId: [111, 222] }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { reopen } = await import("./reopen");
    await reopen.run?.({ args: { issue: "TEST-1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST-1"));
    writeSpy.mockRestore();
  });
});
