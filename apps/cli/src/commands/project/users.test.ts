import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getProjectUsers: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project users", () => {
  it("displays user list in tabular format", async () => {
    mockClient.getProjectUsers.mockResolvedValue([
      { id: 1, userId: "user1", name: "User One", roleType: 1 },
      { id: 2, userId: "user2", name: "User Two", roleType: 2 },
    ]);

    const { users } = await import("./users");
    await users.run?.({ args: { project: "PROJ1" } } as never);

    expect(mockClient.getProjectUsers).toHaveBeenCalledWith("PROJ1");
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("user1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Admin"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal"));
  });

  it("shows message when no users found", async () => {
    mockClient.getProjectUsers.mockResolvedValue([]);

    const { users } = await import("./users");
    await users.run?.({ args: { project: "PROJ1" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No users found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getProjectUsers.mockResolvedValue([
      { id: 1, userId: "user1", name: "User One", roleType: 1 },
    ]);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { users } = await import("./users");
    await users.run?.({ args: { project: "PROJ1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("user1"));
    writeSpy.mockRestore();
  });
});
