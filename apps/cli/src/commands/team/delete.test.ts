import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteTeam: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  confirmOrExit: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("team delete", () => {
  it("deletes team after confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteTeam.mockResolvedValue({ id: 1, name: "Test Team", members: [] });

    const { default: deleteTeam } = await import("./delete");
    await deleteTeam.parseAsync(["1"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete team 1? This cannot be undone.",
      undefined,
    );
    expect(mockClient.deleteTeam).toHaveBeenCalledWith(1);
    expect(consola.success).toHaveBeenCalledWith("Deleted team Test Team (ID: 1)");
  });

  it("skips confirmation with --yes flag", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteTeam.mockResolvedValue({ id: 1, name: "Test Team", members: [] });

    const { default: deleteTeam } = await import("./delete");
    await deleteTeam.parseAsync(["1", "--yes"], { from: "user" });

    expect(confirmOrExit).toHaveBeenCalledWith(
      "Are you sure you want to delete team 1? This cannot be undone.",
      true,
    );
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { default: deleteTeam } = await import("./delete");
    await deleteTeam.parseAsync(["1"], { from: "user" });

    expect(mockClient.deleteTeam).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteTeam.mockResolvedValue({ id: 1, name: "Test Team", members: [] });

    await expectStdoutContaining(async () => {
      const { default: deleteTeam } = await import("./delete");
      await deleteTeam.parseAsync(["1", "--yes", "--json"], { from: "user" });
    }, "Test Team");
  });
});
