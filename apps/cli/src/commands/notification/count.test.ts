import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getNotificationsCount: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("notification count", () => {
  it("counts all notifications when no flags are set", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 42 });

    await parseCommand(() => import("./count"), []);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith({});
    expect(consola.log).toHaveBeenCalledWith("42");
  });

  it("filters read notifications with --already-read read", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 10 });

    await parseCommand(() => import("./count"), ["--already-read", "read"]);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyRead: true }),
    );
  });

  it("filters unread notifications with --already-read unread", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 3 });

    await parseCommand(() => import("./count"), ["--already-read", "unread"]);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyRead: false }),
    );
  });

  it("counts all with --already-read all", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 50 });

    await parseCommand(() => import("./count"), ["--already-read", "all"]);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith({});
  });

  it("filters by resource-already-read", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 5 });

    await parseCommand(() => import("./count"), ["--resource-already-read", "read"]);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ resourceAlreadyRead: true }),
    );
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./count"),
      ["--json"],
      "42",
      () => {
        mockClient.getNotificationsCount.mockResolvedValue({ count: 42 });
      },
    ),
  );
});
