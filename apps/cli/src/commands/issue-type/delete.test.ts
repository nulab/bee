import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteIssueType: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue-type delete", () => {
  it("deletes issue type after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });

    await parseCommand(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-issue-type-id", "2"],
    );

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

    await parseCommand(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-issue-type-id", "2", "--yes"],
    );

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete issue type 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-issue-type-id", "2"],
    );

    expect(mockClient.deleteIssueType).not.toHaveBeenCalled();
  });
  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["1", "-p", "TEST", "--substitute-issue-type-id", "2", "--yes", "--json"],
      "Bug",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteIssueType.mockResolvedValue({ id: 1, name: "Bug", color: "#e30000" });
      },
    ),
  );
});
