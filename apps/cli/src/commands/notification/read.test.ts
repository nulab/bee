import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  markAsReadNotification: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("notification read", () => {
  it("marks a notification as read", async () => {
    mockClient.markAsReadNotification.mockResolvedValue(undefined);

    const { default: read } = await import("./read");
    await read.parseAsync(["12345"], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.markAsReadNotification).toHaveBeenCalledWith(12_345);
    expect(consola.success).toHaveBeenCalledWith("Marked notification 12345 as read.");
  });

  it("converts string ID to number", async () => {
    mockClient.markAsReadNotification.mockResolvedValue(undefined);

    const { default: read } = await import("./read");
    await read.parseAsync(["99"], { from: "user" });

    expect(mockClient.markAsReadNotification).toHaveBeenCalledWith(99);
  });
});
