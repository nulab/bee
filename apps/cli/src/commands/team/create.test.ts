import { promptRequired } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

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

    const { create } = await import("./create");
    await create.run?.({ args: { name: "Dev Team" } } as never);

    expect(mockClient.postTeam).toHaveBeenCalledWith(expect.objectContaining({ name: "Dev Team" }));
    expect(consola.success).toHaveBeenCalledWith("Created team Dev Team (ID: 1)");
  });

  it("prompts for name when not provided", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Prompted Team");
    mockClient.postTeam.mockResolvedValue({ id: 2, name: "Prompted Team", members: [] });

    const { create } = await import("./create");
    await create.run?.({ args: {} } as never);

    expect(promptRequired).toHaveBeenCalledWith("Team name:", undefined);
    expect(mockClient.postTeam).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Prompted Team" }),
    );
  });

  it("passes members as number array", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Team");
    mockClient.postTeam.mockResolvedValue({ id: 3, name: "Team", members: [] });

    const { create } = await import("./create");
    await create.run?.({ args: { name: "Team", members: "111,222" } } as never);

    expect(mockClient.postTeam).toHaveBeenCalledWith(
      expect.objectContaining({ members: [111, 222] }),
    );
  });

  it("shows error and exits when API returns 400 with empty body", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Team");
    const apiError = Object.assign(new Error("Bad Request"), { _status: 400, _body: undefined });
    mockClient.postTeam.mockRejectedValue(apiError);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { create } = await import("./create");
    await create.run?.({ args: { name: "Team" } } as never);

    expect(consola.error).toHaveBeenCalledWith(expect.stringContaining("Administrator role"));
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("outputs JSON when --json flag is set", async () => {
    vi.mocked(promptRequired).mockResolvedValueOnce("Team");
    mockClient.postTeam.mockResolvedValue({ id: 1, name: "Team", members: [] });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { create } = await import("./create");
    await create.run?.({ args: { name: "Team", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Team"));
    writeSpy.mockRestore();
  });
});
