import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getSpaceActivities: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("space activities", () => {
  it("displays activities in formatted output", async () => {
    mockClient.getSpaceActivities.mockResolvedValue([
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

    const { default: activities } = await import("./activities");
    await activities.parseAsync([], { from: "user" });

    expect(mockClient.getSpaceActivities).toHaveBeenCalledWith(expect.any(Object));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-01-15"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Issue Created"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix login bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Project One"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#123"));
  });

  it("shows message when no activities found", async () => {
    mockClient.getSpaceActivities.mockResolvedValue([]);

    const { default: activities } = await import("./activities");
    await activities.parseAsync([], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No activities found.");
  });

  it("passes activity type filter as array of numbers", async () => {
    mockClient.getSpaceActivities.mockResolvedValue([]);

    const { default: activities } = await import("./activities");
    await activities.parseAsync(
      ["--activity-type", "1", "--activity-type", "2", "--activity-type", "3"],
      { from: "user" },
    );

    expect(mockClient.getSpaceActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        activityTypeId: [1, 2, 3],
      }),
    );
  });

  it("passes count parameter", async () => {
    mockClient.getSpaceActivities.mockResolvedValue([]);

    const { default: activities } = await import("./activities");
    await activities.parseAsync(["--count", "50"], { from: "user" });

    expect(mockClient.getSpaceActivities).toHaveBeenCalledWith(
      expect.objectContaining({ count: 50 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getSpaceActivities.mockResolvedValue([
      {
        id: 1,
        type: 1,
        content: { summary: "Test" },
        project: { name: "Proj" },
        createdUser: { name: "User" },
        created: "2024-01-15T10:30:00Z",
      },
    ]);

    await expectStdoutContaining(async () => {
      const { default: activities } = await import("./activities");
      await activities.parseAsync(["--json"], { from: "user" });
    }, "Test");
  });
});
