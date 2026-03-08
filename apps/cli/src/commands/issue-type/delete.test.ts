import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteIssueType: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue-type delete", () => {
  it("deletes issue type after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    const { default: deleteIssueType } = await import("./delete");
    await deleteIssueType.parseAsync(["1", "-p", "TEST", "--substitute-issue-type-id", "2"], {
      from: "user",
    });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete issue type 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteIssueType).toHaveBeenCalledWith("TEST", 1, {
      substituteIssueTypeId: 2,
    });
    expect(consola.success).toHaveBeenCalledWith("Deleted issue type Bug (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    const { default: deleteIssueType } = await import("./delete");
    await deleteIssueType.parseAsync(
      ["1", "-p", "TEST", "--substitute-issue-type-id", "2", "--yes"],
      { from: "user" },
    );

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete issue type 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteIssueType } = await import("./delete");
    await deleteIssueType.parseAsync(["1", "-p", "TEST", "--substitute-issue-type-id", "2"], {
      from: "user",
    });

    expect(mockClient.deleteIssueType).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    await expectStdoutContaining(async () => {
      const { default: deleteIssueType } = await import("./delete");
      await deleteIssueType.parseAsync(
        ["1", "-p", "TEST", "--substitute-issue-type-id", "2", "--yes", "--json"],
        { from: "user" },
      );
    }, "Bug");
  });
});
