import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  patchIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue close", () => {
  it("closes an issue with default resolution", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: close } = await import("./close");
    await close.parseAsync(["TEST-1"], { from: "user" });

    expect(mockClient.patchIssue).toHaveBeenCalledWith("TEST-1", {
      statusId: 4,
      resolutionId: 0,
      comment: undefined,
      notifiedUserId: [],
    });
    expect(consola.success).toHaveBeenCalledWith("Closed issue TEST-1: Title");
  });

  it("closes an issue with a comment", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: close } = await import("./close");
    await close.parseAsync(["TEST-1", "--comment", "Done"], { from: "user" });

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ comment: "Done" }),
    );
  });

  it("closes an issue with a named resolution", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: close } = await import("./close");
    await close.parseAsync(["TEST-1", "--resolution", "duplicate"], { from: "user" });

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ resolutionId: 3 }),
    );
  });

  it("closes an issue with notified users", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: close } = await import("./close");
    await close.parseAsync(["TEST-1", "--notify", "111", "--notify", "222"], { from: "user" });

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ notifiedUserId: [111, 222] }),
    );
  });

  it("falls back to numeric resolution ID when given a number string", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: close } = await import("./close");
    await close.parseAsync(["TEST-1", "--resolution", "4"], { from: "user" });

    expect(mockClient.patchIssue).toHaveBeenCalledWith(
      "TEST-1",
      expect.objectContaining({ resolutionId: 4 }),
    );
  });

  it("throws error when given an unknown resolution name", async () => {
    const { default: close } = await import("./close");

    await expect(
      close.parseAsync(["TEST-1", "--resolution", "typo"], { from: "user" }),
    ).rejects.toThrow();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await expectStdoutContaining(async () => {
      const { default: close } = await import("./close");
      await close.parseAsync(["TEST-1", "--json"], { from: "user" });
    }, "TEST-1");
  });
});
