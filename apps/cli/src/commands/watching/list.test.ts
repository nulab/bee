import { getClient } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { expectStdoutContaining } from "@repo/test-utils";

const mockClient = {
  getWatchingListItems: vi.fn(),
  getMyself: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleWatchings = [
  {
    id: 1,
    resourceAlreadyRead: false,
    issue: { issueKey: "TEST-1", summary: "Fix bug" },
  },
  {
    id: 2,
    resourceAlreadyRead: true,
    issue: { issueKey: "TEST-2", summary: "Add feature" },
  },
];

describe("watching list", () => {
  it("lists watching items for the authenticated user", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getWatchingListItems.mockResolvedValue(sampleWatchings);

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(getClient).toHaveBeenCalled();
    expect(mockClient.getMyself).toHaveBeenCalled();
    expect(mockClient.getWatchingListItems).toHaveBeenCalledWith(100);
    expect(consola.log).toHaveBeenCalled();
  });

  it("shows message when no watching items found", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getWatchingListItems.mockResolvedValue([]);

    const { default: list } = await import("./list");
    await list.parseAsync([], { from: "user" });

    expect(consola.info).toHaveBeenCalledWith("No watching items found.");
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.getMyself.mockResolvedValue({ id: 100 });
    mockClient.getWatchingListItems.mockResolvedValue(sampleWatchings);

    await expectStdoutContaining(async () => {
      const { default: list } = await import("./list");
      await list.parseAsync(["--json"], { from: "user" });
    }, "TEST-1");
  });
});
