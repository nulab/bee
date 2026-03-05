import { getClient } from "@repo/backlog-utils";
import { issuesList, usersGetMyself } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  usersGetMyself: vi.fn(),
  issuesList: vi.fn(),
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

const sampleUser = {
  id: 100,
  name: "Alice",
};

describe("issue status", () => {
  it("displays issues grouped by status", async () => {
    setupMocks();
    vi.mocked(usersGetMyself).mockResolvedValue({
      data: sampleUser,
    } as never);
    vi.mocked(issuesList).mockResolvedValue({
      data: [
        { issueKey: "PROJ-1", summary: "Open issue", status: { name: "Open" } },
        { issueKey: "PROJ-2", summary: "Another open", status: { name: "Open" } },
        { issueKey: "PROJ-3", summary: "In progress", status: { name: "In Progress" } },
      ],
    } as never);

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(usersGetMyself).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
      }),
    );
    expect(issuesList).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        query: expect.objectContaining({
          "assigneeId[]": [100],
          count: 100,
        }),
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Alice"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Open (2)"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("In Progress (1)"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-3"));
  });

  it("shows message when no issues assigned", async () => {
    setupMocks();
    vi.mocked(usersGetMyself).mockResolvedValue({
      data: sampleUser,
    } as never);
    vi.mocked(issuesList).mockResolvedValue({
      data: [],
    } as never);

    const { status } = await import("./status");
    await status.run?.({ args: {} } as never);

    expect(consola.info).toHaveBeenCalledWith("No issues assigned to you.");
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    vi.mocked(usersGetMyself).mockResolvedValue({
      data: sampleUser,
    } as never);
    vi.mocked(issuesList).mockResolvedValue({
      data: [{ issueKey: "PROJ-1", summary: "Test", status: { name: "Open" } }],
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { status } = await import("./status");
    await status.run?.({ args: { json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    writeSpy.mockRestore();
  });
});
