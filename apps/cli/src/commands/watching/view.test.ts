import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({ getWatchingListItem: vi.fn() });

vi.mock("@repo/backlog-utils", () => mockGetClient(mockClient, host));
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

    await parseCommand(() => import("./view"), ["1"]);

    expect(mockClient.getWatchingListItem).toHaveBeenCalledWith(1);
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("TEST-1"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Fix bug"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Important issue"));
    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Unread"));
  });

  it("displays Read status when resourceAlreadyRead is true", async () => {
    mockClient.getWatchingListItem.mockResolvedValue({
      ...sampleWatching,
      resourceAlreadyRead: true,
    });

    await parseCommand(() => import("./view"), ["1"]);

    expect(consola.log).toHaveBeenCalledWith(expect.stringContaining("Read"));
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./view"),
      ["1", "--json"],
      "TEST-1",
      () => {
        mockClient.getWatchingListItem.mockResolvedValue(sampleWatching);
      },
    ),
  );
});
