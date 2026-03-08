import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

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

    const { default: deleteStatus } = await import("./delete");
    await deleteStatus.parseAsync(["1", "-p", "TEST", "--substitute-status-id", "2"], {
      from: "user",
    });

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

    const { default: deleteStatus } = await import("./delete");
    await deleteStatus.parseAsync(["1", "-p", "TEST", "--substitute-status-id", "2", "--yes"], {
      from: "user",
    });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete status 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteStatus } = await import("./delete");
    await deleteStatus.parseAsync(["1", "-p", "TEST", "--substitute-status-id", "2"], {
      from: "user",
    });

    expect(mockClient.deleteProjectStatus).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteProjectStatus.mockResolvedValue({ id: 1, name: "Open", color: "#e30000" });

    await expectStdoutContaining(async () => {
      const { default: deleteStatus } = await import("./delete");
      await deleteStatus.parseAsync(
        ["1", "-p", "TEST", "--substitute-status-id", "2", "--yes", "--json"],
        { from: "user" },
      );
    }, "Open");
  });
});
