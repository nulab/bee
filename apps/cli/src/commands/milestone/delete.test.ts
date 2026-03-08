import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteVersions: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("milestone delete", () => {
  it("deletes milestone after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { deleteMilestone } = await import("./delete");
    await deleteMilestone.run?.({ args: { milestone: "1", project: "TEST" } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete milestone 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteVersions).toHaveBeenCalledWith("TEST", 1);
    expect(consola.success).toHaveBeenCalledWith("Deleted milestone v1.0.0 (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    const { deleteMilestone } = await import("./delete");
    await deleteMilestone.run?.({ args: { milestone: "1", project: "TEST", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteMilestone } = await import("./delete");
    await deleteMilestone.run?.({ args: { milestone: "1", project: "TEST" } } as never);

    expect(mockClient.deleteVersions).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteVersions.mockResolvedValue({ id: 1, name: "v1.0.0" });

    await expectStdoutContaining(async () => {
      const { deleteMilestone } = await import("./delete");
      await deleteMilestone.run?.({
        args: { milestone: "1", project: "TEST", yes: true, json: "" },
      } as never);
    }, "v1.0.0");
  });
});
