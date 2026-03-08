import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getProjectActivities: vi.fn(),
};

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn((label: string, value: unknown) => Promise.resolve(value)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("project activities", () => {
  it("displays activities in formatted output", async () => {
    mockClient.getProjectActivities.mockResolvedValue([
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
    ]);

    const { default: activities } = await import("./activities");
    await activities.parseAsync(["--project", "PROJ1"], { from: "user" });

    expect(mockClient.getProjectActivities).toHaveBeenCalledWith("PROJ1", expect.any(Object));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("2024-01-15"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Issue Created"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix login bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("#123"));
  });

  it("shows message when no activities found", async () => {
    mockClient.getProjectActivities.mockResolvedValue([]);

    const { default: activities } = await import("./activities");
    await activities.parseAsync(["--project", "PROJ1"], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No activities found.");
  });

  it("passes activity type filter as array of numbers", async () => {
    mockClient.getProjectActivities.mockResolvedValue([]);

    const { default: activities } = await import("./activities");
    await activities.parseAsync(["--project", "PROJ1", "--activity-type", "1,2,3"], {
      from: "user",
    });

    expect(mockClient.getProjectActivities).toHaveBeenCalledWith(
      "PROJ1",
      expect.objectContaining({
        activityTypeId: [1, 2, 3],
      }),
    );
  });

  it("passes count parameter", async () => {
    mockClient.getProjectActivities.mockResolvedValue([]);

    const { default: activities } = await import("./activities");
    await activities.parseAsync(["--project", "PROJ1", "--count", "50"], { from: "user" });

    expect(mockClient.getProjectActivities).toHaveBeenCalledWith(
      "PROJ1",
      expect.objectContaining({ count: 50 }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getProjectActivities.mockResolvedValue([
      {
        id: 1,
        type: 1,
        content: { summary: "Test" },
        createdUser: { name: "User" },
        created: "2024-01-15T10:30:00Z",
      },
    ]);

    await expectStdoutContaining(async () => {
      const { default: activities } = await import("./activities");
      await activities.parseAsync(["--project", "PROJ1", "--json"], { from: "user" });
    }, "Test");
  });
});
