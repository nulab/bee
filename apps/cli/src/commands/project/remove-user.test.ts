import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  deleteProjectUsers: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((label: string, value: unknown) => Promise.resolve(value)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project remove-user", () => {
  it("removes a user from a project", async () => {
    mockClient.deleteProjectUsers.mockResolvedValue({ id: 12_345, name: "John Doe" });

    const { default: removeUser } = await import("./remove-user");
    await removeUser.parseAsync(["--project", "TEST", "--user-id", "12345"], { from: "user" });

    expect(mockClient.deleteProjectUsers).toHaveBeenCalledWith("TEST", { userId: 12_345 });
    expect(consola.success).toHaveBeenCalledWith("Removed user John Doe from project TEST.");
  });

  it("throws error when user-id is not a number", async () => {
    const { default: removeUser } = await import("./remove-user");

    await expect(
      removeUser.parseAsync(["--project", "TEST", "--user-id", "abc"], { from: "user" }),
    ).rejects.toThrow("User ID must be a number.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.deleteProjectUsers.mockResolvedValue({ id: 12_345, name: "John Doe" });

    await expectStdoutContaining(async () => {
      const { default: removeUser } = await import("./remove-user");
      await removeUser.parseAsync(["--project", "TEST", "--user-id", "12345", "--json"], {
        from: "user",
      });
    }, "John Doe");
  });
});
