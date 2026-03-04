import { getClient } from "@repo/backlog-utils";
import { projectsGetActivities } from "@repo/openapi-client";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(),
}));

vi.mock("@repo/openapi-client", () => ({
  projectsGetActivities: vi.fn(),
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

describe("project activities", () => {
  it("displays activities in formatted output", async () => {
    setupMocks();
    vi.mocked(projectsGetActivities).mockResolvedValue({
      data: [
        {
          id: 1,
          type: 1,
          content: { summary: "Fix login bug" },
          createdUser: { name: "Test User" },
          created: "2024-01-15T10:30:00Z",
        },
        {
          id: 2,
          type: 2,
          content: { key_id: 123 },
          createdUser: { name: "Another User" },
          created: "2024-01-14T09:00:00Z",
        },
      ],
    } as never);

    const { activities } = await import("./activities");
    await activities.run?.({ args: { project: "PROJ1" } } as never);

    expect(projectsGetActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        client: mockClient,
        throwOnError: true,
        path: { projectIdOrKey: "PROJ1" },
      }),
    );
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-01-15"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Issue Created"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix login bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#123"));
  });

  it("shows message when no activities found", async () => {
    setupMocks();
    vi.mocked(projectsGetActivities).mockResolvedValue({
      data: [],
    } as never);

    const { activities } = await import("./activities");
    await activities.run?.({ args: { project: "PROJ1" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No activities found.");
  });

  it("passes activity type filter as array of numbers", async () => {
    setupMocks();
    vi.mocked(projectsGetActivities).mockResolvedValue({
      data: [],
    } as never);

    const { activities } = await import("./activities");
    await activities.run?.({
      args: { project: "PROJ1", "activity-type": "1,2,3" },
    } as never);

    expect(projectsGetActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          "activityTypeId[]": [1, 2, 3],
        }),
      }),
    );
  });

  it("passes count parameter", async () => {
    setupMocks();
    vi.mocked(projectsGetActivities).mockResolvedValue({
      data: [],
    } as never);

    const { activities } = await import("./activities");
    await activities.run?.({
      args: { project: "PROJ1", count: "50" },
    } as never);

    expect(projectsGetActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ count: 50 }),
      }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    setupMocks();
    const activityData = [
      {
        id: 1,
        type: 1,
        content: { summary: "Test" },
        createdUser: { name: "User" },
        created: "2024-01-15T10:30:00Z",
      },
    ];
    vi.mocked(projectsGetActivities).mockResolvedValue({
      data: activityData,
    } as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { activities } = await import("./activities");
    await activities.run?.({ args: { project: "PROJ1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Test"));
    writeSpy.mockRestore();
  });
});
