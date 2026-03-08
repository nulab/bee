import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  postProjectUser: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project add-user", () => {
  it("adds a user to a project", async () => {
    mockClient.postProjectUser.mockResolvedValue({ id: 12_345, name: "John Doe" });

    const { addUser } = await import("./add-user");
    await addUser.run?.({
      args: { project: "TEST", "user-id": "12345" },
    } as never);

    expect(mockClient.postProjectUser).toHaveBeenCalledWith("TEST", "12345");
    expect(consola.success).toHaveBeenCalledWith("Added user John Doe to project TEST.");
  });

  it("throws error when user-id is not a number", async () => {
    const { addUser } = await import("./add-user");

    await expect(
      addUser.run?.({
        args: { project: "TEST", "user-id": "invalid" },
      } as never),
    ).rejects.toThrow("User ID must be a number.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postProjectUser.mockResolvedValue({ id: 12_345, name: "John Doe" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { addUser } = await import("./add-user");
    await addUser.run?.({
      args: { project: "TEST", "user-id": "12345", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("John Doe"));
    writeSpy.mockRestore();
  });
});
