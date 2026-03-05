import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchTeam: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("team edit", () => {
  it("updates team name", async () => {
    mockClient.patchTeam.mockResolvedValue({ id: 1, name: "New Name", members: [] });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { team: "1", name: "New Name" } } as never);

    expect(mockClient.patchTeam).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated team New Name (ID: 1)");
  });

  it("updates team members", async () => {
    mockClient.patchTeam.mockResolvedValue({ id: 1, name: "Team", members: [] });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { team: "1", members: "111,222" } } as never);

    expect(mockClient.patchTeam).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ members: [111, 222] }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchTeam.mockResolvedValue({ id: 1, name: "Team", members: [] });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { edit } = await import("./edit");
    await edit.run?.({ args: { team: "1", name: "Team", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Team"));
    writeSpy.mockRestore();
  });
});
