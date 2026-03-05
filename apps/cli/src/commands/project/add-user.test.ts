import { getClient } from "@repo/backlog-utils";
import { projectsAddUser } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsAddUser: vi.fn(),
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

describe("project add-user", () => {
  it("adds a user to a project", async () => {
    setupMocks();
    vi.mocked(projectsAddUser).mockResolvedValue({
      data: { id: 12_345, name: "John Doe" },
    } as never);

    const { addUser } = await import("./add-user");
    await addUser.run?.({
      args: { project: "TEST", "user-id": "12345" },
    } as never);

    expect(projectsAddUser).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { projectIdOrKey: "TEST" },
        body: { userId: 12_345 },
      }),
    );
    expect(consola.success).toHaveBeenCalledWith("Added user John Doe to project TEST.");
  });

  it("shows error when user-id is not a number", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    const { addUser } = await import("./add-user");

    await expect(
      addUser.run?.({
        args: { project: "TEST", "user-id": "invalid" },
      } as never),
    ).rejects.toThrow("process.exit");

    expect(consola.error).toHaveBeenCalledWith("User ID must be a number.");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    const user = { id: 12_345, name: "John Doe" };
    vi.mocked(projectsAddUser).mockResolvedValue({
      data: user,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { addUser } = await import("./add-user");
    await addUser.run?.({
      args: { project: "TEST", "user-id": "12345", json: "" },
    } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("John Doe"));
    writeSpy.mockRestore();
  });
});
