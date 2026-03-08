import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

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

    const { deleteDocument } = await import("./delete");
    await deleteDocument.run?.({ args: { document: "12345" } } as never);

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

    const { deleteDocument } = await import("./delete");
    await deleteDocument.run?.({ args: { document: "12345", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteDocument } = await import("./delete");
    await deleteDocument.run?.({ args: { document: "12345" } } as never);

    expect(mockClient.deleteDocument).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteDocument.mockResolvedValue({ id: "1", title: "My Doc" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { deleteDocument } = await import("./delete");
    await deleteDocument.run?.({ args: { document: "12345", yes: true, json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("My Doc"));
    writeSpy.mockRestore();
  });
});
