import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  resetWatchingListItemAsRead: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("watching read", () => {
  it("marks a watching item as read", async () => {
    mockClient.resetWatchingListItemAsRead.mockResolvedValue(undefined);

    const { read } = await import("./read");
    await read.run?.({ args: { watching: "12345" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.resetWatchingListItemAsRead).toHaveBeenCalledWith(12_345);
    expect(consola.success).toHaveBeenCalledWith("Marked watching 12345 as read.");
  });
});
