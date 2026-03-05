import { getClient } from "@repo/backlog-utils";
import { projectsDeleteUser } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsDeleteUser: vi.fn(),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const mockClient = {
  interceptors: { request: { use: vi.fn() } },
};

const setupMocks = () => {
  vi.mocked(getClient).mockResolvedValue({
    client: mockClient as never,
    host: "example.backlog.com",
  });
};

describe("project remove-user", () => {
  it("removes a user from a project", async () => {
    setupMocks();
    vi.mocked(projectsDeleteUser).mockResolvedValue({
      data: { id: 12_345, name: "John Doe" },
    } as never);

    const { removeUser } = await import("./remove-user");
    await removeUser.run?.({
      args: { project: "TEST", "user-id": "12345" },
    } as never);

    expect(projectsDeleteUser).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { projectIdOrKey: "TEST" },
        body: { userId: 12_345 },
      }),
    );
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
    setupMocks();
    const user = { id: 12_345, name: "John Doe" };
    vi.mocked(projectsDeleteUser).mockResolvedValue({
      data: user,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { removeUser } = await import("./remove-user");
    await removeUser.run?.({
      args: { project: "TEST", "user-id": "12345", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("John Doe"));
    writeSpy.mockRestore();
  });
});
