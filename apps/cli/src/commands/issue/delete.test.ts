import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteIssue: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("issue delete", () => {
  it("deletes issue after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });

    await parseCommand(() => import("./delete"), ["TEST-1"]);

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

    await parseCommand(() => import("./delete"), ["TEST-1", "--yes"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete issue TEST-1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(() => import("./delete"), ["TEST-1"]);

    expect(mockClient.deleteIssue).not.toHaveBeenCalled();
  });
  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["TEST-1", "--yes", "--json"],
      "TEST-1",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteIssue.mockResolvedValue({ issueKey: "TEST-1", summary: "Title" });
      },
    ),
  );
});
