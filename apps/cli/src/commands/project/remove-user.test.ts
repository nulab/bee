import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  deleteProjectUsers: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project remove-user", () => {
  it("removes a user from a project", async () => {
    mockClient.deleteProjectUsers.mockResolvedValue({ id: 12_345, name: "John Doe" });

    const { removeUser } = await import("./remove-user");
    await removeUser.run?.({
      args: { project: "TEST", "user-id": "12345" },
    } as never);

    expect(mockClient.deleteProjectUsers).toHaveBeenCalledWith("TEST", { userId: 12_345 });
    expect(consola.success).toHaveBeenCalledWith("Removed user John Doe from project TEST.");
  });

  it("shows error when user-id is not a number", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    const { removeUser } = await import("./remove-user");

    await expect(
      removeUser.run?.({
        args: { project: "TEST", "user-id": "abc" },
      } as never),
    ).rejects.toThrow("process.exit");

    expect(consola.error).toHaveBeenCalledWith("User ID must be a number.");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.deleteProjectUsers.mockResolvedValue({ id: 12_345, name: "John Doe" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { removeUser } = await import("./remove-user");
    await removeUser.run?.({
      args: { project: "TEST", "user-id": "12345", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("John Doe"));
    writeSpy.mockRestore();
  });
});
