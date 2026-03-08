import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deletehWatchingListItem: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("watching delete", () => {
  it("deletes watching after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deletehWatchingListItem.mockResolvedValue({ id: 1 });

    const { default: deleteWatching } = await import("./delete");
    await deleteWatching.parseAsync(["1"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete watching 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deletehWatchingListItem).toHaveBeenCalledWith(1);
    expect(consola.success).toHaveBeenCalledWith("Deleted watching 1.");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deletehWatchingListItem.mockResolvedValue({ id: 1 });

    const { default: deleteWatching } = await import("./delete");
    await deleteWatching.parseAsync(["1", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete watching 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteWatching } = await import("./delete");
    await deleteWatching.parseAsync(["1"], { from: "user" });

    expect(mockClient.deletehWatchingListItem).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deletehWatchingListItem.mockResolvedValue({ id: 1 });

    await expectStdoutContaining(async () => {
      const { default: deleteWatching } = await import("./delete");
      await deleteWatching.parseAsync(["1", "--yes", "--json"], { from: "user" });
    }, "1");
  });
});
