import { openOrPrintUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getMyself: vi.fn(),
  getNotificationsCount: vi.fn(),
  getIssues: vi.fn(),
  getProjects: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  openOrPrintUrl: vi.fn(),
  dashboardUrl: vi.fn((host: string) => `https://${host}/dashboard`),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleMyself = {
  id: 1,
  userId: "testuser",
  name: "Test User",
  mailAddress: "test@example.com",
  roleType: 2,
};

const sampleNotifications = { count: 3 };

const sampleIssues = [
  {
    issueKey: "PROJ-1",
    summary: "Fix login bug",
    status: { name: "Open" },
    priority: { name: "High" },
    dueDate: "2026-04-01T00:00:00Z",
  },
  {
    issueKey: "PROJ-2",
    summary: "Add feature",
    status: { name: "In Progress" },
    priority: { name: "Normal" },
    dueDate: null,
  },
];

const sampleProjects = [
  { projectKey: "PROJ", name: "My Project" },
  { projectKey: "TEAM", name: "Team Project" },
];

describe("dashboard", () => {
  it("displays dashboard with issues table and projects", async () => {
    mockClient.getMyself.mockResolvedValue(sampleMyself);
    mockClient.getNotificationsCount.mockResolvedValue(sampleNotifications);
    mockClient.getIssues.mockResolvedValue(sampleIssues);
    mockClient.getProjects.mockResolvedValue(sampleProjects);

    const { default: dashboard } = await import("./dashboard");
    await dashboard.parseAsync([], { from: "user" });

    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith({
      alreadyRead: false,
      resourceAlreadyRead: false,
    });
    expect(mockClient.getIssues).toHaveBeenCalledWith({
      assigneeId: [-1],
      statusId: [1, 2, 3],
      count: 20,
      sort: "dueDate",
      order: "asc",
    });
    expect(mockClient.getProjects).toHaveBeenCalledWith({ all: false });
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Test User"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("3"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ"));
  });

  it("opens browser with --web flag", async () => {
    const { default: dashboard } = await import("./dashboard");
    await dashboard.parseAsync(["--web"], { from: "user" });

    expect(openOrPrintUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/dashboard",
      false,
      consola,
    );
    expect(mockClient.getMyself).not.toHaveBeenCalled();
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue(sampleMyself);
    mockClient.getNotificationsCount.mockResolvedValue(sampleNotifications);
    mockClient.getIssues.mockResolvedValue(sampleIssues);
    mockClient.getProjects.mockResolvedValue(sampleProjects);

    await expectStdoutContaining(async () => {
      const { default: dashboard } = await import("./dashboard");
      await dashboard.parseAsync(["--json"], { from: "user" });
    }, "Test User");
  });

  it("shows empty message when no assigned issues", async () => {
    mockClient.getMyself.mockResolvedValue(sampleMyself);
    mockClient.getNotificationsCount.mockResolvedValue({ count: 0 });
    mockClient.getIssues.mockResolvedValue([]);
    mockClient.getProjects.mockResolvedValue([]);

    const { default: dashboard } = await import("./dashboard");
    await dashboard.parseAsync([], { from: "user" });

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("No assigned issues"));
  });
});
