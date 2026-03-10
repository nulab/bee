import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getUsers: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("user list", () => {
  it("displays user list in tabular format", async () => {
    mockClient.getUsers.mockResolvedValue([
      { id: 1, userId: "user1", name: "User One", roleType: 1 },
      { id: 2, userId: "user2", name: "User Two", roleType: 2 },
    ]);

    await parseCommand(() => import("./list"), []);

    expect(mockClient.getUsers).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("user1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Administrator"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal User"));
  });

  it("shows message when no users found", async () => {
    mockClient.getUsers.mockResolvedValue([]);

    await parseCommand(() => import("./list"), []);

    expect(consola.info).toHaveBeenCalledWith("No users found.");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--json"],
      "user1",
      () => {
        mockClient.getUsers.mockResolvedValue([
          { id: 1, userId: "user1", name: "User One", roleType: 1 },
        ]);
      },
    ),
  );
});
