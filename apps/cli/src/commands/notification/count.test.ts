import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getNotificationsCount: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("notification count", () => {
  it("counts all notifications when no flags are set", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 42 });

    const { count } = await import("./count");
    await count.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith({});
    expect(consola.log).toHaveBeenCalledWith("42");
  });

  it("filters read notifications with --already-read read", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 10 });

    const { count } = await import("./count");
    await count.run?.({ args: { "already-read": "read" } } as never);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyRead: true }),
    );
  });

  it("filters unread notifications with --already-read unread", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 3 });

    const { count } = await import("./count");
    await count.run?.({ args: { "already-read": "unread" } } as never);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyRead: false }),
    );
  });

  it("counts all with --already-read all", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 50 });

    const { count } = await import("./count");
    await count.run?.({ args: { "already-read": "all" } } as never);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith({});
  });

  it("filters by resource-already-read", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 5 });

    const { count } = await import("./count");
    await count.run?.({ args: { "resource-already-read": "read" } } as never);

    expect(mockClient.getNotificationsCount).toHaveBeenCalledWith(
      expect.objectContaining({ resourceAlreadyRead: true }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getNotificationsCount.mockResolvedValue({ count: 42 });

    await expectStdoutContaining(async () => {
      const { count } = await import("./count");
      await count.run?.({ args: { json: "" } } as never);
    }, "42");
  });
});
