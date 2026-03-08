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

    const { deleteWatching } = await import("./delete");
    await deleteWatching.run?.({ args: { watching: "1" } } as never);

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

    const { deleteWatching } = await import("./delete");
    await deleteWatching.run?.({ args: { watching: "1", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteWatching } = await import("./delete");
    await deleteWatching.run?.({ args: { watching: "1" } } as never);

    expect(mockClient.deletehWatchingListItem).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deletehWatchingListItem.mockResolvedValue({ id: 1 });

    await expectStdoutContaining(async () => {
      const { deleteWatching } = await import("./delete");
      await deleteWatching.run?.({
        args: { watching: "1", yes: true, json: "" },
      } as never);
    }, "1");
  });
});
