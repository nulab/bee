import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ deletehWatchingListItem: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("watching delete", () => {
  it("deletes watching after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deletehWatchingListItem.mockResolvedValue({ id: 1 });

    await parseCommand(() => import("./delete"), ["1"]);

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

    await parseCommand(() => import("./delete"), ["1", "--yes"]);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete watching 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);
    await parseCommand(() => import("./delete"), ["1"]);

    expect(mockClient.deletehWatchingListItem).not.toHaveBeenCalled();
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./delete"),
      ["1", "--yes", "--json"],
      "1",
      () => {
        vi.mocked(confirmOrExit).mockResolvedValue(true);
        mockClient.deletehWatchingListItem.mockResolvedValue({ id: 1 });
      },
    ),
  );
});
