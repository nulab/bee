import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  resetNotificationsMarkAsRead: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("notification read-all", () => {
  it("marks all notifications as read", async () => {
    mockClient.resetNotificationsMarkAsRead.mockResolvedValue({ count: 0 });

    const { readAll } = await import("./read-all");
    await readAll.run?.({ args: {} } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.resetNotificationsMarkAsRead).toHaveBeenCalled();
    expect(consola.success).toHaveBeenCalledWith("Marked all notifications as read.");
  });
});
