import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  deleteProjectStatus: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("status delete", () => {
  it("deletes status after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    const { deleteStatus } = await import("./delete");
    await deleteStatus.run?.({
      args: { status: "1", project: "TEST", "substitute-status-id": "2" },
    } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete status 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteProjectStatus).toHaveBeenCalledWith("TEST", 1, 2);
    expect(consola.success).toHaveBeenCalledWith("Deleted status Open (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    const { deleteStatus } = await import("./delete");
    await deleteStatus.run?.({
      args: { status: "1", project: "TEST", "substitute-status-id": "2", yes: true },
    } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteStatus } = await import("./delete");
    await deleteStatus.run?.({
      args: { status: "1", project: "TEST", "substitute-status-id": "2" },
    } as never);

    expect(mockClient.deleteProjectStatus).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { deleteStatus } = await import("./delete");
    await deleteStatus.run?.({
      args: {
        status: "1",
        project: "TEST",
        "substitute-status-id": "2",
        yes: true,
        json: "",
      },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Open"));
    writeSpy.mockRestore();
  });
});
