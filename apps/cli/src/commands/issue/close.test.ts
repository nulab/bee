import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue close", () => {
  it("closes an issue with default resolution", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { close } = await import("./close");
    await close.run?.({ args: { issue: "TEST-1" } } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith("TEST-1", {
      statusId: 4,
      resolutionId: 0,
      comment: undefined,
    });
    expect(consola.success).toHaveBeenCalledWith("Closed issue TEST-1: Title");
  });

  it("closes an issue with a comment", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { close } = await import("./close");
    await close.run?.({ args: { issue: "TEST-1", comment: "Done" } } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ comment: "Done" }),
    );
  });

  it("closes an issue with a specific resolution", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { close } = await import("./close");
    await close.run?.({ args: { issue: "TEST-1", resolution: "1" } } as never);

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ resolutionId: 1 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { close } = await import("./close");
    await close.run?.({ args: { issue: "TEST-1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST-1"));
    writeSpy.mockRestore();
  });
});
