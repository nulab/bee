import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  getWatchingListItem: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleWatching = {
  id: 1,
  resourceAlreadyRead: false,
  note: "Important issue",
  issue: { issueKey: "TEST-1", summary: "Fix bug" },
  created: "2025-01-01T00:00:00Z",
  updated: "2025-01-02T00:00:00Z",
};

describe("watching view", () => {
  it("displays watching item details", async () => {
    mockClient.getWatchingListItem.mockResolvedValue(sampleWatching);

    const { view } = await import("./view");
    await view.run?.({ args: { watching: "1" } } as never);

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getWatchingListItem).toHaveBeenCalledWith(1);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("TEST-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Important issue"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unread"));
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getWatchingListItem.mockResolvedValue(sampleWatching);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { view } = await import("./view");
    await view.run?.({ args: { watching: "1", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("TEST-1"));
    writeSpy.mockRestore();
  });
});
