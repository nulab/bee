import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

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

    const { deleteWiki } = await import("./delete");
    await deleteWiki.run?.({ args: { wiki: "123" } } as never);

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

    const { deleteWiki } = await import("./delete");
    await deleteWiki.run?.({ args: { wiki: "123", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteWiki } = await import("./delete");
    await deleteWiki.run?.({ args: { wiki: "123" } } as never);

    expect(mockClient.deleteWiki).not.toHaveBeenCalled();
  });

  it("passes notify flag to deleteWiki", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    const { deleteWiki } = await import("./delete");
    await deleteWiki.run?.({ args: { wiki: "123", yes: true, "mail-notify": true } } as never);

    expect(mockClient.deleteWiki).toHaveBeenCalledWith(123, true);
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteWiki.mockResolvedValue({ id: 123, name: "Old Page" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { deleteWiki } = await import("./delete");
    await deleteWiki.run?.({ args: { wiki: "123", yes: true, json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Old Page"));
    writeSpy.mockRestore();
  });
});
