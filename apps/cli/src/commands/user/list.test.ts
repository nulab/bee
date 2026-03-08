import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getUsers: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("user list", () => {
  it("displays user list in tabular format", async () => {
    mockClient.getUsers.mockResolvedValue([
      { id: 1, userId: "user1", name: "User One", roleType: 1 },
      { id: 2, userId: "user2", name: "User Two", roleType: 2 },
    ]);

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getUsers).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("user1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Administrator"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal User"));
  });

  it("shows message when no users found", async () => {
    mockClient.getUsers.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No users found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getUsers.mockResolvedValue([
      { id: 1, userId: "user1", name: "User One", roleType: 1 },
    ]);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["--json"], { from: "user" });
    }, "user1");
  });
});
