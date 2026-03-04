import { getClient } from "@repo/backlog-utils";
import { projectsGetUsers } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsGetUsers: vi.fn(),
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

describe("project users", () => {
  it("displays user list in tabular format", async () => {
    setupMocks();
    vi.mocked(projectsGetUsers).mockResolvedValue({
      data: [
        { id: 1, userId: "user1", name: "User One", roleType: 1 },
        { id: 2, userId: "user2", name: "User Two", roleType: 2 },
      ],
    } as never);

    const { users } = await import("./users");
    await users.run?.({ args: { project: "PROJ1" } } as never);

    expect(projectsGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { projectIdOrKey: "PROJ1" },
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("ID"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("user1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Admin"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Normal"));
  });

  it("shows message when no users found", async () => {
    setupMocks();
    vi.mocked(projectsGetUsers).mockResolvedValue({
      data: [],
    } as never);

    const { users } = await import("./users");
    await users.run?.({ args: { project: "PROJ1" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No users found.");
  });

  it("passes excludeGroupMembers query parameter", async () => {
    setupMocks();
    vi.mocked(projectsGetUsers).mockResolvedValue({
      data: [],
    } as never);

    const { users } = await import("./users");
    await users.run?.({
      args: { project: "PROJ1", "exclude-group-members": true },
    } as never);

    expect(projectsGetUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ excludeGroupMembers: true }),
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    const usersData = [{ id: 1, userId: "user1", name: "User One", roleType: 1 }];
    vi.mocked(projectsGetUsers).mockResolvedValue({
      data: usersData,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { users } = await import("./users");
    await users.run?.({ args: { project: "PROJ1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("user1"));
    writeSpy.mockRestore();
  });
});
