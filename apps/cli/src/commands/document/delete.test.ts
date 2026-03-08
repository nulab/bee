import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteDocument: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("document delete", () => {
  it("deletes document after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteDocument.mockResolvedValue({ id: "1", title: "My Doc" });

    const { default: deleteDocument } = await import("./delete");
    await deleteDocument.parseAsync(["12345"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete document 12345? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteDocument).toHaveBeenCalledWith("12345");
    expect(consola.success).toHaveBeenCalledWith("Deleted document My Doc (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteDocument.mockResolvedValue({ id: "1", title: "My Doc" });

    const { default: deleteDocument } = await import("./delete");
    await deleteDocument.parseAsync(["12345", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete document 12345? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteDocument } = await import("./delete");
    await deleteDocument.parseAsync(["12345"], { from: "user" });

    expect(mockClient.deleteDocument).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteDocument.mockResolvedValue({ id: "1", title: "My Doc" });

    await expectStdoutContaining(async () => {
      const { default: deleteDocument } = await import("./delete");
      await deleteDocument.parseAsync(["12345", "--yes", "--json"], { from: "user" });
    }, "My Doc");
  });
});
