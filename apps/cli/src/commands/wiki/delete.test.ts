import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteWiki: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki delete", () => {
  it("deletes wiki page after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    const { default: deleteWiki } = await import("./delete");
    await deleteWiki.parseAsync(["123"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete wiki page 123? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteWiki).toHaveBeenCalledWith(123, false);
    expect(consola.success).toHaveBeenCalledWith("Deleted wiki page 123: Old Page");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    const { default: deleteWiki } = await import("./delete");
    await deleteWiki.parseAsync(["123", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete wiki page 123? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteWiki } = await import("./delete");
    await deleteWiki.parseAsync(["123"], { from: "user" });

    expect(mockClient.deleteWiki).not.toHaveBeenCalled();
  });

  it("passes notify flag to deleteWiki", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    const { default: deleteWiki } = await import("./delete");
    await deleteWiki.parseAsync(["123", "--yes", "--mail-notify"], { from: "user" });

    expect(mockClient.deleteWiki).toHaveBeenCalledWith(123, true);
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    await expectStdoutContaining(async () => {
      const { default: deleteWiki } = await import("./delete");
      await deleteWiki.parseAsync(["123", "--yes", "--json"], { from: "user" });
    }, "Old Page");
  });
});
