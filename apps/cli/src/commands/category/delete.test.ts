import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteCategories: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("category delete", () => {
  it("deletes category after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteCategories.mockResolvedValue({ id: 1, name: "Bug" });

    const { deleteCategory } = await import("./delete");
    await deleteCategory.run?.({ args: { category: "1", project: "TEST" } } as never);

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

    const { deleteCategory } = await import("./delete");
    await deleteCategory.run?.({ args: { category: "1", project: "TEST", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete category 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteCategory } = await import("./delete");
    await deleteCategory.run?.({ args: { category: "1", project: "TEST" } } as never);

    expect(mockClient.deleteCategories).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteCategories.mockResolvedValue({ id: 1, name: "Bug" });

    await expectStdoutContaining(async () => {
      const { deleteCategory } = await import("./delete");
      await deleteCategory.run?.({
        args: { category: "1", project: "TEST", yes: true, json: "" },
      } as never);
    }, "Bug");
  });
});
