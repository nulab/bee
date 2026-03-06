import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getUserActivities: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("user activities", () => {
  it("displays activities in formatted output", async () => {
    mockClient.getUserActivities.mockResolvedValue([
      {
        id: 1,
        type: 1,
        content: { summary: "Fix login bug" },
        project: { name: "Project One" },
        createdUser: { name: "Test User" },
        created: "2024-01-15T10:30:00Z",
      },
      {
        id: 2,
        type: 2,
        content: { key_id: 123 },
        project: { name: "Project Two" },
        createdUser: { name: "Test User" },
        created: "2024-01-14T09:00:00Z",
      },
    ]);

    const { activities } = await import("./activities");
    await activities.run?.({ args: { user: "12345" } } as never);

    expect(mockClient.getUserActivities).toHaveBeenCalledWith(12_345, expect.any(Object));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-01-15"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Issue Created"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix login bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Project One"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#123"));
  });

  it("shows message when no activities found", async () => {
    mockClient.getUserActivities.mockResolvedValue([]);

    const { activities } = await import("./activities");
    await activities.run?.({ args: { user: "12345" } } as never);

    expect(consola.info).toHaveBeenCalledWith("No activities found.");
  });

  it("passes activity type filter as array of numbers", async () => {
    mockClient.getUserActivities.mockResolvedValue([]);

    const { activities } = await import("./activities");
    await activities.run?.({
      args: { user: "12345", "activity-type": "1,2,3" },
    } as never);

    expect(mockClient.getUserActivities).toHaveBeenCalledWith(
      12_345,
      expect.objectContaining({
        activityTypeId: [1, 2, 3],
      }),
    );
  });

  it("passes count parameter", async () => {
    mockClient.getUserActivities.mockResolvedValue([]);

    const { activities } = await import("./activities");
    await activities.run?.({
      args: { user: "12345", count: "50" },
    } as never);

    expect(mockClient.getUserActivities).toHaveBeenCalledWith(
      12_345,
      expect.objectContaining({ count: 50 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getUserActivities.mockResolvedValue([
      {
        id: 1,
        type: 1,
        content: { summary: "Test" },
        project: { name: "Proj" },
        createdUser: { name: "User" },
        created: "2024-01-15T10:30:00Z",
      },
    ]);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { activities } = await import("./activities");
    await activities.run?.({ args: { user: "12345", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Test"));
    writeSpy.mockRestore();
  });
});
