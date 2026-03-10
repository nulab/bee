import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  postProjectUser: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((label: string, value: unknown) => Promise.resolve(value)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project add-user", () => {
  it("adds a user to a project", async () => {
    mockClient.postProjectUser.mockResolvedValue({ id: 12_345, name: "John Doe" });

    const { default: addUser } = await import("./add-user");
    await addUser.parseAsync(["--project", "TEST", "--user-id", "12345"], { from: "user" });

    expect(mockClient.postProjectUser).toHaveBeenCalledWith("TEST", "12345");
    expect(consola.success).toHaveBeenCalledWith("Added user John Doe to project TEST.");
  });

  it("throws error when user-id is not a number", async () => {
    const { default: addUser } = await import("./add-user");

    await expect(
      addUser.parseAsync(["--project", "TEST", "--user-id", "invalid"], { from: "user" }),
    ).rejects.toThrow();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.postProjectUser.mockResolvedValue({ id: 12_345, name: "John Doe" });

    await expectStdoutContaining(async () => {
      const { default: addUser } = await import("./add-user");
      await addUser.parseAsync(["--project", "TEST", "--user-id", "12345", "--json"], {
        from: "user",
      });
    }, "John Doe");
  });
});
