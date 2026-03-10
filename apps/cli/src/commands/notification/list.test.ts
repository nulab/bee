import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getNotifications: vi.fn() });

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("notification list", () => {
  it("displays notifications in tabular format", async () => {
    mockClient.getNotifications.mockResolvedValue([
      {
        id: 100,
        alreadyRead: false,
        reason: 2,
        resourceAlreadyRead: false,
        issue: { issueKey: "PROJ-1", summary: "Bug fix" },
        sender: { name: "Alice" },
        created: "2025-01-15T10:00:00Z",
      },
      {
        id: 101,
        alreadyRead: true,
        reason: 1,
        resourceAlreadyRead: true,
        issue: { issueKey: "PROJ-2", summary: "Feature" },
        sender: { name: "Bob" },
        created: "2025-01-14T09:00:00Z",
      },
    ]);

    await parseCommand(() => import("./list"));

    expect(mockClient.getNotifications).toHaveBeenCalled();
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("PROJ-2"));
  });

  it("marks unread notifications with asterisk", async () => {
    mockClient.getNotifications.mockResolvedValue([
      {
        id: 100,
        alreadyRead: false,
        reason: 2,
        resourceAlreadyRead: false,
        issue: { issueKey: "PROJ-1", summary: "Bug" },
        sender: { name: "Alice" },
        created: "2025-01-15T10:00:00Z",
      },
    ]);

    await parseCommand(() => import("./list"));

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("*"));
  });

  it("shows message when no notifications found", async () => {
    mockClient.getNotifications.mockResolvedValue([]);

    await parseCommand(() => import("./list"));

    expect(consola.info).toHaveBeenCalledWith("No notifications found.");
  });

  it("displays dash when issue is null", async () => {
    mockClient.getNotifications.mockResolvedValue([
      {
        id: 102,
        alreadyRead: true,
        reason: 2,
        resourceAlreadyRead: true,
        issue: null,
        sender: { name: "Charlie" },
        created: "2025-01-16T10:00:00Z",
      },
    ]);

    await parseCommand(() => import("./list"));

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("-"));
  });

  it("passes limit, min-id, max-id, and order parameters", async () => {
    mockClient.getNotifications.mockResolvedValue([]);

    await parseCommand(
      () => import("./list"),
      ["--count", "5", "--min-id", "10", "--max-id", "100", "--order", "asc"],
    );

    expect(mockClient.getNotifications).toHaveBeenCalledWith({
      count: 5,
      minId: 10,
      maxId: 100,
      order: "asc",
    });
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./list"),
      ["--json"],
      "PROJ-1",
      () =>
        mockClient.getNotifications.mockResolvedValue([
          {
            id: 100,
            alreadyRead: false,
            reason: 2,
            resourceAlreadyRead: false,
            issue: { issueKey: "PROJ-1", summary: "Bug" },
            sender: { name: "Alice" },
            created: "2025-01-15T10:00:00Z",
          },
        ]),
    ),
  );
});
