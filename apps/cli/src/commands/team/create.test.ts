import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postTeam: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("team create", () => {
  it("creates a team with provided name", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Dev Team");
    mockClient.postTeam.mockResolvedValue({ id: 1, name: "Dev Team", members: [] });

    const { default: create } = await import("./create");
    await create.parseAsync(["--name", "Dev Team"], { from: "user" });

    expect(mockClient.postTeam).toHaveBeenCalledWith(expect.objectContaining({ name: "Dev Team" }));
    expect(consola.success).toHaveBeenCalledWith("Created team Dev Team (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Team");
    mockClient.postTeam.mockResolvedValue({ id: 2, name: "Prompted Team", members: [] });

    const { default: create } = await import("./create");
    await create.parseAsync([], { from: "user" });

    expect(promptRequired).toHaveBeenCalledWith("Team name:", undefined);
    expect(mockClient.postTeam).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Prompted Team" }),
    );
  });

  it("passes members as number array", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Team");
    mockClient.postTeam.mockResolvedValue({ id: 3, name: "Team", members: [] });

    const { default: create } = await import("./create");
    await create.parseAsync(["--name", "Team", "--members", "111", "--members", "222"], {
      from: "user",
    });

    expect(mockClient.postTeam).toHaveBeenCalledWith(
      expect.objectContaining({ members: [111, 222] }),
    );
  });

  it("throws error when API returns 400 with empty body", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Team");
    const apiError = Object.assign(new Error("Bad Request"), { _status: 400, _body: undefined });
    mockClient.postTeam.mockRejectedValue(apiError);

    const { default: create } = await import("./create");

    await expect(create.parseAsync(["--name", "Team"], { from: "user" })).rejects.toThrow(
      "Administrator role",
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Team");
    mockClient.postTeam.mockResolvedValue({ id: 1, name: "Team", members: [] });

    await expectStdoutContaining(async () => {
      const { default: create } = await import("./create");
      await create.parseAsync(["--name", "Team", "--json"], { from: "user" });
    }, "Team");
  });
});
