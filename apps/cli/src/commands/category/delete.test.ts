import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deleteCategories: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category delete", () => {
  it("deletes category after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteCategories.mockResolvedValue({ id: 1, name: "Bug" });

    await parseCommand(() => import("./delete"), ["1", "-p", "TEST"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete category 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteCategories).toHaveBeenCalledWith("TEST", 1);
    expect(consola.success).toHaveBeenCalledWith("Deleted category Bug (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteCategories.mockResolvedValue({ id: 1, name: "Bug" });

    await parseCommand(() => import("./delete"), ["1", "-p", "TEST", "--yes"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete category 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(() => import("./delete"), ["1", "-p", "TEST"]);

    expect(mockClient.deleteCategories).not.toHaveBeenCalled();
  });
  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["1", "-p", "TEST", "--yes", "--json"],
      "Bug",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deleteCategories.mockResolvedValue({ id: 1, name: "Bug" });
      },
    ),
  );
});
