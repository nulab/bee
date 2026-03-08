import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

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

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "--name", "New Name"], { from: "user" });

    expect(mockClient.patchTeam).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: "New Name" }),
    );
    expect(consola.success).toHaveBeenCalledWith("Updated team New Name (ID: 1)");
  });

  it("updates team members", async () => {
    mockClient.patchTeam.mockResolvedValue({ id: 1, name: "Team", members: [] });

    const { default: edit } = await import("./edit");
    await edit.parseAsync(["1", "--members", "111", "--members", "222"], { from: "user" });

    expect(mockClient.patchTeam).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ members: [111, 222] }),
    );
  });

  it("throws error when API returns 400 with empty body", async () => {
    const apiError = Object.assign(new Error("Bad Request"), { _status: 400, _body: undefined });
    mockClient.patchTeam.mockRejectedValue(apiError);

    const { default: edit } = await import("./edit");

    await expect(edit.parseAsync(["1", "--name", "X"], { from: "user" })).rejects.toThrow(
      "Administrator role",
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchTeam.mockResolvedValue({ id: 1, name: "Team", members: [] });

    await expectStdoutContaining(async () => {
      const { default: edit } = await import("./edit");
      await edit.parseAsync(["1", "--name", "Team", "--json"], { from: "user" });
    }, "Team");
  });
});
