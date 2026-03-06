import { confirmOrExit } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

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

    const { deleteTeam } = await import("./delete");
    await deleteTeam.run?.({ args: { team: "1" } } as never);

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

    const { deleteTeam } = await import("./delete");
    await deleteTeam.run?.({ args: { team: "1", yes: true } } as never);

    expect(confirmOrExit).toHaveBeenCalledWith(expect.any(String), true);
  });

  it("cancels when user declines confirmation", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(false);

    const { deleteTeam } = await import("./delete");
    await deleteTeam.run?.({ args: { team: "1" } } as never);

    expect(mockClient.deleteTeam).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(confirmOrExit).mockResolvedValue(true);
    mockClient.deleteTeam.mockResolvedValue({ id: 1, name: "Test Team", members: [] });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { deleteTeam } = await import("./delete");
    await deleteTeam.run?.({ args: { team: "1", yes: true, json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Test Team"));
    writeSpy.mockRestore();
  });
});
