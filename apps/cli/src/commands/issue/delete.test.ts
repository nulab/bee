import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteIssue: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue delete", () => {
  it("deletes issue after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: deleteIssue } = await import("./delete");
    await deleteIssue.parseAsync(["TEST-1"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete issue TEST-1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteIssue).toHaveBeenCalledWith("TEST-1");
    expect(consola.success).toHaveBeenCalledWith("Deleted issue TEST-1: Title");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    const { default: deleteIssue } = await import("./delete");
    await deleteIssue.parseAsync(["TEST-1", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete issue TEST-1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteIssue } = await import("./delete");
    await deleteIssue.parseAsync(["TEST-1"], { from: "user" });

    expect(mockClient.deleteIssue).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await expectStdoutContaining(async () => {
      const { default: deleteIssue } = await import("./delete");
      await deleteIssue.parseAsync(["TEST-1", "--yes", "--json"], { from: "user" });
    }, "TEST-1");
  });
});
